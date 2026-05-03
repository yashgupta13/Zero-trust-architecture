import json
import os
import sys
import time
from flask import Flask, render_template, request, jsonify, session, url_for, redirect, make_response
from flask_cors import CORS
import logging
import math
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import requests
import yaml
import re
import uuid
from functools import wraps

sys.path.insert(0, '..')

# ── Networking import (for P2P node communication) ───────────────────────────
try:
    import sys as _sys
    _sys.path.insert(0, '..')
    from Networking import Networking
except Exception as _e:
    print(f"[WARN] P2P Networking unavailable: {_e}")
    Networking = None

# ── Shared helpers (no longer Keycloak-dependent) ────────────────────────────
from PAM import PAM
from PAM_Mail_Notification import send_email, send_email_to_approver
from trust_signal_collection import load_events_data, process_events

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

app.config.update({
    'SECRET_KEY': 'bzf9bctfGor9tB2rOfLdQnK3VNDxt6rx',
    'TESTING': True,
    'DEBUG': True,
})

# ── SQLAlchemy ────────────────────────────────────────────────────────────────
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///privileged_access.db'
db = SQLAlchemy(app)


class AccessRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    resource_name = db.Column(db.String(100), nullable=False)
    reason_for_access = db.Column(db.String(250), nullable=False)
    access_duration = db.Column(db.Integer, nullable=False)
    requestor_id = db.Column(db.String(100), nullable=False)
    requestor_username = db.Column(db.String(100), nullable=False)
    time_of_request = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    requestStatus = db.Column(db.String(20), default="pending")


class Approver(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    approverID = db.Column(db.String(100), nullable=False)
    approverEmail = db.Column(db.String(100), nullable=False)
    request_id = db.Column(db.Integer, db.ForeignKey('access_request.id'), nullable=False)
    approver_secret_share = db.Column(db.String(750))
    approver_action = db.Column(db.String(20))


RESOURCE_SECRET_KEY = ''
THRESHOLD = None

# ── User store (replaces Keycloak) ───────────────────────────────────────────
USERS_FILE = os.path.join(os.path.abspath(os.path.join(os.getcwd(), os.pardir)), 'users_auth.json')


def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return []


def get_user_by_credentials(username, password):
    for u in load_users():
        if u['username'] == username and u['password'] == password:
            return u
    return None


def get_user_by_id(user_id):
    for u in load_users():
        if u['user_id'] == user_id:
            return u
    return None


def get_approver_emails():
    return [u['email'] for u in load_users() if u.get('user_role') == 'Approver']


# ── Auth decorator (replaces @oidc.require_login) ────────────────────────────
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated


# ── Helper: public IP / location / MAC ───────────────────────────────────────
def get_public_ip():
    try:
        return requests.get('https://api.ipify.org', timeout=3).text
    except Exception:
        return '127.0.0.1'


def get_location(ip_address=''):
    try:
        r = requests.get(f'https://ipapi.co/{ip_address}/json/', timeout=3)
        return r.json()
    except Exception:
        return {'ip': ip_address, 'city': 'Unknown', 'country': 'Unknown'}


def get_mac_details(mac):
    try:
        r = requests.get(f'https://api.macvendors.com/{mac}', timeout=3)
        return r.text
    except Exception:
        return 'Unknown'


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('home'))
    return redirect(url_for('login_page'))


@app.route('/login', methods=['GET'])
def login_page():
    """Serve a minimal login page (React handles the real UI; this is a fallback)."""
    if 'user_id' in session:
        return redirect(url_for('home'))
    return render_template('index.html')


@app.route('/api/login', methods=['POST'])
def api_login():
    """JSON login endpoint used by the React frontend."""
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    user = get_user_by_credentials(username, password)
    if not user:
        return jsonify({'error': 'Invalid username or password'}), 401

    session.permanent = True
    session['user_id']   = user['user_id']
    session['username']  = user['username']
    session['email']     = user['email']
    session['user_role'] = user['user_role']

    return jsonify({
        'user_id':   user['user_id'],
        'username':  user['username'],
        'email':     user['email'],
        'user_role': user['user_role'],
    })


@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'message': 'Logged out'})


@app.route('/revokeToken')
def revokeToken():
    session.clear()
    return redirect(url_for('login_page'))


@app.route('/home')
@login_required
def home():
    user = get_user_by_id(session['user_id'])
    if not user:
        return redirect(url_for('login_page'))

    # Update user_data.json
    parent_directory = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
    file_path = os.path.join(parent_directory, 'user_data.json')
    all_users = load_users()

    extracted_data = [
        {
            'user_id':          u['user_id'],
            'username':         u['username'],
            'email':            u['email'],
            'created_timestamp': u.get('created_timestamp', 0),
            'email_verified':   u.get('email_verified', False),
            'totp_enabled':     u.get('totp_enabled', False),
            'user_role':        u.get('user_role', ''),
        }
        for u in all_users
    ]

    existing_data = []
    if os.path.exists(file_path):
        with open(file_path, 'r') as jf:
            try:
                existing_data = json.load(jf)
            except json.JSONDecodeError:
                existing_data = []

    existing_ids = {u['user_id'] for u in existing_data}
    for u in extracted_data:
        if u['user_id'] not in existing_ids:
            existing_data.append(u)

    with open(file_path, 'w') as jf:
        json.dump(existing_data, jf, indent=4)

    return render_template('home.html',
                           username=user['username'],
                           email=user['email'],
                           user_id=user['user_id'],
                           user_role=user['user_role'])


# ── Access decision helpers ───────────────────────────────────────────────────
parent_directory = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
file_path = os.path.join(parent_directory, 'access_decision.json')


def get_latest_access_decision():
    latest_decision = None
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            access_decisions = json.load(f)
            if access_decisions:
                latest_decision = max(access_decisions, key=lambda x: x['ID'])
    return latest_decision


@app.route('/receive-access-request', methods=['POST'])
def receive_and_process_access_request():
    data = request.json
    fp = os.path.join(os.path.abspath(os.path.join(os.getcwd(), os.pardir)), 'access_requests.json')
    existing_data = []
    new_id = 1

    try:
        if os.path.exists(fp):
            with open(fp, 'r') as f:
                existing_data = json.load(f)
                if existing_data:
                    new_id = existing_data[-1]['ID'] + 1
    except (json.JSONDecodeError, FileNotFoundError) as e:
        print(f"Error loading JSON: {e}")

    access_request = {
        'ID':                  new_id,
        'user_id':             data.pop('userId'),
        'intent':              data['intent'],
        'resource_requested':  data['resource'],
        'access_request_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'public_ip_address':   data.get('public_ip', ''),
        'location':            data.get('location', ''),
        'device_type':         data.get('deviceType', ''),
        'browser':             data.get('userAgent', ''),
        'device_mac':          data.get('device_mac', ''),
        'device_vendor':       data.get('device_vendor', ''),
        'device_OS':           data.get('operatingSystem', ''),
    }

    existing_data.append(access_request)

    try:
        with open(fp, 'w') as f:
            json.dump(existing_data, f, indent=4)
    except IOError as e:
        print(f"Error writing JSON: {e}")

    if Networking:
        try:
            node4 = Networking("127.0.0.1", 8004, 4)
            node4.start()
            node4.connect_with_node('127.0.0.1', 8001)
            node4.connect_with_node('127.0.0.1', 8003)
            node4.send_message_to_node('1', access_request)

            time.sleep(2)  # wait for policy engine verdict
            access_decision = get_latest_access_decision()
            node4.stop()

            if access_decision:
                return jsonify({'verdict': access_decision.get('access_decision')})
        except Exception as e:
            print(f"P2P network error: {e}")

    # Fallback: grant access if P2P nodes aren't running
    return jsonify({'verdict': 1})


@app.route('/resource-selection')
@login_required
def resource_selection():
    user_id    = session.get('user_id', '')
    location   = 'Unknown/Unknown'
    ip         = '127.0.0.1'
    device_mac = ':'.join(re.findall('..', '%012x' % uuid.getnode()))
    device_vendor = 'Unknown'
    return render_template('resourceSelection.html',
                           user_id=user_id,
                           location=location,
                           public_ip=ip,
                           device_mac=device_mac,
                           device_vendor=device_vendor)


def update_policy_configurations(data):
    parent_directory = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
    fp = os.path.join(parent_directory, 'policyConfiguration.yml')
    try:
        with open(fp, 'r') as f:
            existing_data = yaml.safe_load(f) or {}
    except FileNotFoundError:
        existing_data = {}
    existing_data.update(data)
    with open(fp, 'w') as f:
        yaml.dump(existing_data, f)


@app.route('/receivePolicyConfigurations', methods=['POST'])
def receive_policy_configurations():
    if request.method == 'POST':
        data = request.json
        update_policy_configurations(data)
        return 'Received Policy Configurations successfully!', 200
    return 'Invalid request method', 405


@app.route('/resource-1')
def display_transactions():
    with open('mobile_money_transactions.json', 'r') as f:
        transactions = json.load(f)
    return render_template('transaction_simulation.html', transactions=transactions)


@app.route('/resource-2')
def display_tokens():
    with open('tokens.json', 'r') as f:
        tokens = json.load(f)
    return render_template('Fintech Access Tokens.html', tokens=tokens)


@app.route('/logging')
def access_requests():
    fp = os.path.join(os.path.dirname(os.getcwd()), 'access_requests.json')
    with open(fp, 'r') as f:
        access_requests_data = json.load(f)
    return render_template('logging_and_monitoring.html', access_requests=access_requests_data)


@app.route('/configurePolicies', methods=['POST', 'GET'])
@login_required
def configure_policies():
    latest_access_request = AccessRequest.query.order_by(AccessRequest.id.desc()).limit(1).all()
    if latest_access_request:
        for req in latest_access_request:
            access_duration = req.access_duration
            current_time    = datetime.now()
            expiration_time = current_time + timedelta(minutes=access_duration)
            return render_template('policyConfiguration.html', expiration_time=expiration_time)


@app.route('/privilegedAccess', methods=['GET', 'POST'])
@login_required
def privilegedAccess():
    email_addresses = get_approver_emails()
    num_shares      = len(email_addresses)

    global THRESHOLD
    THRESHOLD = math.floor(num_shares * 0.8) if num_shares else 1

    secret_key_identifier  = PAM.generate_secret_message(4)

    global RESOURCE_SECRET_KEY
    RESOURCE_SECRET_KEY = PAM.generate_secret_message(45)

    secret_shares_list = PAM.generate_secret_shares(THRESHOLD, num_shares, RESOURCE_SECRET_KEY, secret_key_identifier)

    if request.method == 'POST':
        resource_name      = request.form.get('resource_name') or (request.json or {}).get('resource_name')
        reason_for_access  = request.form.get('reason_for_access') or (request.json or {}).get('reason_for_access')
        access_duration    = int(request.form.get('access_duration') or (request.json or {}).get('access_duration', 0))
        requestor_id       = session.get('user_id')
        requestor_username = session.get('username')
        time_of_request    = datetime.now()
        selected_approvers = request.form.getlist('approvers') or (request.json or {}).get('approvers', [])

        for index, approver in enumerate(selected_approvers):
            if index < len(secret_shares_list):
                approver_secret_share = secret_shares_list[index]
                send_email_to_approver(approver, requestor_id, requestor_username,
                                       reason_for_access, access_duration, approver_secret_share)

        if 1 <= access_duration <= 100:
            new_request = AccessRequest(
                resource_name=resource_name,
                reason_for_access=reason_for_access,
                access_duration=access_duration,
                requestor_id=requestor_id,
                requestor_username=requestor_username,
                time_of_request=time_of_request,
                requestStatus='pending',
            )
            db.session.add(new_request)
            db.session.commit()

            for index, approver_email in enumerate(selected_approvers):
                approver_record = Approver(
                    approverID=approver_email,
                    approverEmail=approver_email,
                    request_id=new_request.id,
                )
                db.session.add(approver_record)
            db.session.commit()

            return redirect(url_for('approval_status'))

    return render_template('privilegedAccessManagement.html', email_addresses=email_addresses)


@app.route('/testing')
@login_required
def testApproval():
    user_role = session.get('user_role')
    if user_role != 'Approver':
        return redirect(url_for('revokeToken'))

    user_id  = session.get('user_id')
    username = session.get('username')
    email    = session.get('email')

    approver      = Approver.query.filter_by(approverID=user_id).order_by(Approver.id.desc()).first()
    access_requests_list = AccessRequest.query.order_by(AccessRequest.id.desc()).limit(1).all()

    return render_template('apprPage.html',
                           access_requests=access_requests_list,
                           username=username,
                           email=email,
                           user_id=user_id,
                           user_role=user_role)


@app.route('/approve_request', methods=['POST'])
def approve_request():
    data         = request.json
    action       = data.get('action')
    approver_id  = data.get('approverId')
    secret_share = data.get('secretShare')

    approver = Approver.query.filter_by(approverID=approver_id).order_by(Approver.id.desc()).first()
    if approver:
        approver.approver_action      = 'approved' if action == 'approve' else 'rejected'
        approver.approver_secret_share = secret_share
        db.session.commit()
        return 'Request Approved!'
    return 'Invalid Request'


@app.route('/approval_status', methods=['GET', 'POST'])
def approval_status():
    if request.method == 'POST':
        data           = request.json
        action         = data.get('action')
        latest_request = AccessRequest.query.order_by(AccessRequest.id.desc()).first()
        if latest_request:
            latest_request_id     = latest_request.id
            approved_approvers    = Approver.query.filter_by(request_id=latest_request_id, approver_action='approved').count()
            approved_approver_obs = Approver.query.filter_by(request_id=latest_request_id, approver_action='approved').all()

            if approved_approvers >= THRESHOLD and action == 'reconstruct_secret':
                secret_shares        = [a.approver_secret_share for a in approved_approver_obs]
                reconstructed_secret = str(PAM.reconstruct_secret_from_base64_shares(secret_shares))[2:-1]
                latest_request.requestStatus = 'approved'
                db.session.commit()
                return jsonify({'reconstructed_secret': reconstructed_secret})
            else:
                return jsonify({'ERR_THRESH': 'Minimum threshold not reached!'})

    latest_request = AccessRequest.query.order_by(AccessRequest.id.desc()).first()
    if latest_request:
        latest_request_id  = latest_request.id
        approvers_count    = Approver.query.filter_by(request_id=latest_request_id).count()
        approved_approvers = Approver.query.filter_by(request_id=latest_request_id, approver_action='approved').count()
        pending_approvers  = approvers_count - approved_approvers
        approval_info      = f'{approved_approvers}/{approvers_count} approvers approved, {pending_approvers} pending'

        APPROVAL_TIME   = 2
        current_time    = datetime.now()
        expiration_time = current_time + timedelta(minutes=APPROVAL_TIME)

        reconstructed_secret = None
        if pending_approvers == 0 and approvers_count > 0:
            approved_approver_obs = Approver.query.filter_by(request_id=latest_request_id, approver_action='approved').all()
            secret_shares         = [a.approver_secret_share for a in approved_approver_obs]
            reconstructed_secret  = PAM.reconstruct_secret_from_base64_shares(secret_shares)
            latest_request.requestStatus = 'approved'
            db.session.commit()
        message = '' if pending_approvers > 0 else 'All approvers have approved the request'

        # Return JSON if requested by React frontend
        if request.headers.get('Accept', '').startswith('application/json'):
            return jsonify({
                'approval_info':       approval_info,
                'message':             message,
                'reconstructed_secret': str(reconstructed_secret)[2:-1] if reconstructed_secret else None,
                'threshold':           THRESHOLD,
                'expiration_time':     expiration_time.isoformat(),
            })

        return render_template('approval_status.html',
                               approval_info=approval_info,
                               message=message,
                               reconstructed_secret=reconstructed_secret,
                               threshold=THRESHOLD,
                               expiration_time=expiration_time)

    return render_template('no_requests.html')


@app.route('/success', methods=['GET'])
def approval_success():
    return render_template('success.html')


@app.route('/enterSecretKey', methods=['GET', 'POST'])
def process_secret_key():
    if request.method == 'POST':
        entered_secret_key = request.form.get('secret_key')
        if entered_secret_key:
            response = requests.post('http://127.0.0.1:5000/hidden_resource',
                                     data={'secret_key': entered_secret_key})
            if response.text == 'Valid':
                return redirect('/configurePolicies')
            else:
                return "INVALID SECRET KEY"
    return render_template('enterSecretKey.html')


@app.route('/hidden_resource', methods=['POST'])
def hidden_resource():
    entered_secret_key = request.form.get('secret_key')
    secret_message     = RESOURCE_SECRET_KEY
    if entered_secret_key == secret_message:
        return 'Valid'
    return 'Invalid'


@app.route('/protected_page')
def protected_page():
    latest_access_request = AccessRequest.query.order_by(AccessRequest.id.desc()).limit(1).all()
    if latest_access_request:
        for req in latest_access_request:
            access_duration = req.access_duration
            current_time    = datetime.now()
            expiration_time = current_time + timedelta(minutes=access_duration)
            return render_template('protectedPage.html', expiration_time=expiration_time)
    return "No REQUESTS FOUND!"


@app.route('/viewAccessRequests')
@login_required
def view_access_requests():
    access_requests_list = AccessRequest.query.all()
    approvers_list       = Approver.query.all()
    return render_template('viewAccessRequests.html',
                           access_requests=access_requests_list,
                           approvers=approvers_list)


# ── React Frontend API Endpoints ──────────────────────────────────────────────

@app.route('/api/me')
def api_me():
    """Return current session user info for the React frontend."""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    return jsonify({
        'user_id':   session.get('user_id'),
        'username':  session.get('username'),
        'email':     session.get('email'),
        'user_role': session.get('user_role'),
    })


@app.route('/api/access-requests')
def api_access_requests():
    fp = os.path.join(os.path.abspath(os.path.join(os.getcwd(), os.pardir)), 'access_requests.json')
    if not os.path.exists(fp):
        return jsonify([])
    with open(fp, 'r') as f:
        return jsonify(json.load(f))


@app.route('/api/approvers')
def api_approvers():
    return jsonify({'approvers': get_approver_emails()})


@app.route('/api/transactions')
def api_transactions():
    try:
        with open('mobile_money_transactions.json', 'r') as f:
            return jsonify(json.load(f))
    except FileNotFoundError:
        return jsonify([])


@app.route('/api/tokens')
def api_tokens():
    try:
        with open('tokens.json', 'r') as f:
            return jsonify(json.load(f))
    except FileNotFoundError:
        return jsonify([])


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
