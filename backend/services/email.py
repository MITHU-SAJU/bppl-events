import os
import smtplib

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from dotenv import load_dotenv

load_dotenv()


def send_event_notification_email(event_data: dict):

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    admin_email = os.getenv("ADMIN_EMAIL")

    if not smtp_user or not smtp_password or not admin_email:
        print("[WARNING] SMTP settings incomplete")
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
    msg["From"] = "BPPL Event Tracker <bproduction313@gmail.com>"
    msg["To"] = admin_email

    msg.attach(
        MIMEText(
            html_content,
            "html"
        )
    )

    try:

        server = smtplib.SMTP(
            smtp_host,
            smtp_port,
            timeout=30
        )

        server.ehlo()
        server.starttls()
        server.ehlo()

        server.login(
            smtp_user,
            smtp_password
        )

        server.sendmail(
            smtp_user,
            [admin_email],
            msg.as_string()
        )

        server.quit()

        print("[SUCCESS] Event email sent")

    except Exception as e:

        print(
            f"[ERROR] Failed to send email: {repr(e)}"
        )