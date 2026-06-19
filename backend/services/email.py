import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

def send_event_notification_email(event_data: dict):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port_env = os.getenv("SMTP_PORT", "587")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    admin_email = os.getenv("ADMIN_EMAIL")

    if not smtp_host or not smtp_user or not smtp_password or not admin_email:
        print("[WARNING] SMTP settings incomplete (missing host, user, password, or admin email)", flush=True)
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

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"BPPL Event Tracker <{admin_email}>"
    msg["To"] = admin_email

    msg.attach(MIMEText(html_content, "html"))

    # Determine ports to try
    ports_to_try = []
    try:
        ports_to_try.append(int(smtp_port_env))
    except ValueError:
        ports_to_try.append(587)

    # Port 2525 is supported by Brevo and is unblocked on Render's free plan
    if 2525 not in ports_to_try:
        ports_to_try.append(2525)

    success = False
    for port in ports_to_try:
        print(f"[INFO] Attempting to send email via SMTP {smtp_host}:{port}...", flush=True)
        try:
            server = smtplib.SMTP(smtp_host, port, timeout=15)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, [admin_email], msg.as_string())
            server.quit()
            print(f"[SUCCESS] Event email sent successfully on port {port}", flush=True)
            success = True
            break
        except Exception as e:
            print(f"[WARNING] Failed to send email on port {port}: {repr(e)}", flush=True)

    if not success:
        print("[ERROR] Failed to send email on all attempted SMTP ports.", flush=True)