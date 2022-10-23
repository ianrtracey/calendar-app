import styles from '../styles/Home.module.css'
import { Button, Dropdown, Input } from 'semantic-ui-react'
import { useEffect, useState } from 'react'
import { Text, Checkbox, Drawer } from '@geist-ui/react'
import _ from 'lodash'

const EventItem = ({ event }: { event: any }) => {
  const title =
    event.summary.length < 30
      ? event.summary
      : event.summary.slice(0, 30) + '...'
  return (
    <Text b style={{ margin: 0, padding: 0 }}>
      {`${title} (${event.duration}m)`}
    </Text>
  )
}

export default function Home () {
  const [events, setEvents] = useState([])
  const [stickyFooterOpen, setFooterOpen] = useState(true)
  useEffect(() => {
    fetch('/api/calendar').then(resp =>
      resp.json().then(data => {
        setEvents(data.events)
      })
    )
  }, [])
  console.log(events)

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        marginTop: '100px',
        padding: '20px',
        height: '500px',
        overflow: 'scroll'
      }}
    >
      <div>
        <div style={{ display: 'flex' }}>
          <div>Events</div>
          <div>Events</div>
        </div>
        <div>
          {events &&
            events.map(event => (
              <div>
                <Checkbox scale={3} checked={false} />
                <EventItem event={event} />
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
