import os
import urllib.request
import urllib.error
import json
from dotenv import load_dotenv

load_dotenv()

def send_event_notification_email(event_data: dict):
    smtp_password = os.getenv("SMTP_PASSWORD")
    admin_email = os.getenv("ADMIN_EMAIL")

    if not smtp_password or not admin_email:
        print("[WARNING] SMTP settings incomplete (missing SMTP_PASSWORD or ADMIN_EMAIL)", flush=True)
        return

    employee_name = event_data.get("employeeName", "Unknown Employee")
    employee_id = event_data.get("employeeId", "N/A")
    event_name = event_data.get("eventName", "Unnamed Event")
    location = event_data.get("eventPlace", "Unknown Location")
    particulars = event_data.get("particulars", "None")
    start_date = event_data.get("startDate", "N/A")
    end_date = event_data.get("endDate", "N/A")
    days = event_data.get("days", 0)

    subject = f"✈️ BPPL Event Log: {employee_name} - {event_name}"

    html_content = f"""
    <html>
    <body style="
        font-family:Arial;
        background:#f1f5f9;
        padding:20px;
    ">

    <div style="
        max-width:600px;
        margin:auto;
        background:white;
        padding:25px;
        border-radius:12px;
    ">

        <h2 style="
            background:#1e3a8a;
            color:white;
            padding:20px;
            text-align:center;
        ">
            New Event Registration
        </h2>

        <p>Hello Admin,</p>

        <p>
            A new event registration has been submitted.
        </p>

        <table width="100%" cellpadding="10">

            <tr>
                <td><b>Employee Name</b></td>
                <td>{employee_name}</td>
            </tr>

            <tr>
                <td><b>Employee ID</b></td>
                <td>{employee_id}</td>
            </tr>

            <tr>
                <td><b>Event Name</b></td>
                <td>{event_name}</td>
            </tr>

            <tr>
                <td><b>Event Place</b></td>
                <td>{location}</td>
            </tr>

            <tr>
                <td><b>Particulars</b></td>
                <td>{particulars}</td>
            </tr>

            <tr>
                <td><b>Start Date</b></td>
                <td>{start_date}</td>
            </tr>

            <tr>
                <td><b>End Date</b></td>
                <td>{end_date}</td>
            </tr>

            <tr>
                <td><b>Duration</b></td>
                <td>{days} day(s)</td>
            </tr>

        </table>

        <br>

        <center>
            BPPL Event Tracker System
        </center>

    </div>

    </body>
    </html>
    """

    # Hit Brevo HTTP API directly instead of SMTP to bypass Render's port 587/465 blocking on free tiers
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": smtp_password,
        "content-type": "application/json"
    }
    payload = {
        "sender": {
            "name": "BPPL Event Tracker",
            "email": admin_email  # Sender must be verified in your Brevo account
        },
        "to": [
            {
                "email": admin_email,
                "name": "Admin"
            }
        ],
        "subject": subject,
        "htmlContent": html_content
    }

    try:
        req = urllib.request.Request(
            url, 
            data=json.dumps(payload).encode("utf-8"), 
            headers=headers, 
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=20) as response:
            response_body = response.read().decode("utf-8")
            print(f"[SUCCESS] Event email sent via Brevo HTTP API: {response_body}", flush=True)
    except urllib.error.HTTPError as e:
        try:
            error_body = e.read().decode("utf-8")
            print(f"[ERROR] HTTPError while sending email via Brevo API: {e.code} - {e.reason} - {error_body}", flush=True)
        except Exception:
            print(f"[ERROR] HTTPError while sending email via Brevo API: {e.code} - {e.reason}", flush=True)
    except Exception as e:
        print(f"[ERROR] Failed to send email via Brevo HTTP API: {repr(e)}", flush=True)