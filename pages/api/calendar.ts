// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'
import process from 'process'
import { authenticate } from '@google-cloud/local-auth'
import { google } from 'googleapis'
import moment from 'moment'
import * as _ from 'lodash'

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
const TOKEN_FILE_PATH = path.join(process.cwd(), 'token.json')
const GOOGLE_CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json')

interface Event {
  summary: string
  start: string
  creator_email: string
  response_status: string
}

const loadSavedCredentialsIfExist = async () => {
  try {
    const content = (await fs.readFile(TOKEN_FILE_PATH)) as any
    const credentials = JSON.parse(content)
    return google.auth.fromJSON(credentials)
  } catch (err) {
    return null
  }
}

const saveCredentials = async (client: any) => {
  const content = (await fs.readFile(GOOGLE_CREDENTIALS_PATH)) as any
  const keys = JSON.parse(content)
  const key = keys.installed || keys.web
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token
  })
  console.log(payload)
  await fs.writeFile(TOKEN_FILE_PATH, payload)
}

const authorize = async () => {
  let client = await loadSavedCredentialsIfExist()
  if (client) {
    return client
  }
  client = (await authenticate({
    scopes: SCOPES,
    keyfilePath: GOOGLE_CREDENTIALS_PATH
  })) as any
  if (!client || !client.credentials) {
    return null
  }
  await saveCredentials(client)
  return client
}

const getEvents = async (auth: any): Promise<Event[]> => {
  const calendar = google.calendar({ version: 'v3', auth }) as any
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: moment()
      .subtract(7, 'days')
      .toISOString(),
    timeMax: moment().toISOString(),
    maxResults: 50,
    singleEvents: true,
    orderBy: 'startTime'
  })
  const events = res.data.items
  return events.map((event: any) => ({
    summary: event.summary,
    startDate: moment(event.start.dateTime || event.start.date).format(
      'dddd, MMM DD YYYY'
    ),
    start: event.start.dateTime || event.start.date,
    end: event.end.dateTime || event.end.date,
    duration: moment(event.end.dateTime || event.end.date).diff(
      moment(event.start.dateTime || event.start.date),
      'minutes'
    ),
    status: event.status,
    creatorEmail: event.creator.email,
    responseStatus:
      (event.attendees &&
        event.attendees.find((attendee: any) => attendee.self)
          .responseStatus) ||
      null
  }))
}

const hello = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = await authorize()
  const events = await getEvents(client)
  res.status(200).json({ events })
}

export default hello
