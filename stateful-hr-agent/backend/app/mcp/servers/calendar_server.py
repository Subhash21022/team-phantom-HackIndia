from typing import Any, Dict
import os
import datetime
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


def get_credentials():
    creds = None
    if os.path.exists("token_calendar.json"):
        creds = Credentials.from_authorized_user_file("token_calendar.json", SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists("credentials.json"):
                raise FileNotFoundError("Google OAuth credentials.json not found. Please add your credentials from GCP.")
            flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        with open("token_calendar.json", "w") as token:
            token.write(creds.to_json())
    return creds


async def execute_calendar(action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Real Google Calendar MCP Server using OAuth.
    """
    try:
        creds = get_credentials()
        service = build("calendar", "v3", credentials=creds)

        if action == "create_event":
            title = payload.get("title", "HR Interview")
            start_time = payload.get("start_time") or datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
            start_dt = datetime.datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            end_dt = start_dt + datetime.timedelta(hours=1)

            attendees = [{"email": email} for email in payload.get("attendees", []) if email]

            event = {
                "summary": title,
                "start": {"dateTime": start_dt.isoformat(), "timeZone": "UTC"},
                "end": {"dateTime": end_dt.isoformat(), "timeZone": "UTC"},
                "attendees": attendees,
                "conferenceData": {
                    "createRequest": {
                        "requestId": f"req_{int(datetime.datetime.now().timestamp())}",
                        "conferenceSolutionKey": {"type": "hangoutsMeet"},
                    }
                },
            }

            event = service.events().insert(calendarId="primary", body=event, conferenceDataVersion=1).execute()
            return {
                "status": "success",
                "message": "Event created successfully",
                "data": {
                    "event_id": event.get("id"),
                    "meeting_link": event.get("hangoutLink", ""),
                    "start_time": start_time,
                },
            }

        if action == "update_event":
            event_id = payload.get("event_id")
            if not event_id:
                return {"status": "error", "message": "event_id is required for update_event"}

            patch: Dict[str, Any] = {}
            if payload.get("title"):
                patch["summary"] = payload["title"]
            if payload.get("start_time"):
                start_dt = datetime.datetime.fromisoformat(str(payload["start_time"]).replace("Z", "+00:00"))
                end_dt = start_dt + datetime.timedelta(hours=1)
                patch["start"] = {"dateTime": start_dt.isoformat(), "timeZone": "UTC"}
                patch["end"] = {"dateTime": end_dt.isoformat(), "timeZone": "UTC"}

            updated = service.events().patch(calendarId="primary", eventId=event_id, body=patch).execute()
            return {"status": "success", "message": "Event updated successfully", "data": {"event_id": updated.get("id")}}

        if action == "cancel_event":
            event_id = payload.get("event_id")
            if not event_id:
                return {"status": "error", "message": "event_id is required for cancel_event"}
            service.events().delete(calendarId="primary", eventId=event_id).execute()
            return {"status": "success", "message": "Event cancelled successfully", "data": {"event_id": event_id}}

        return {"status": "error", "message": f"Unknown action: {action}"}

    except Exception as e:
        return {"status": "error", "message": f"Calendar API Error: {str(e)}"}
