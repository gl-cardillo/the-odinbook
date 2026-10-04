import { useState } from "react";
import { FiUsers } from "react-icons/fi";
import {
  Alert,
  Avatar,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Field,
  inputProps,
  Modal,
  PersonRow,
} from ".";

const people = [
  { id: "1", fullname: "Ada Lovelace", profilePicUrl: "/icon.png" },
  { id: "2", fullname: "Grace Hopper" },
  { id: "3", fullname: "Alan Turing", profilePicUrl: "/missing.png" },
];

// every shared piece in every variant, only in development at /ui
export function UiPreview() {
  const [open, setOpen] = useState(false);

  return (
    <main
      style={{
        display: "grid",
        gap: 16,
        maxWidth: 720,
        margin: "0 auto",
        padding: 24,
      }}
    >
      <h1>UI pieces</h1>

      <Card title="Buttons">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="success">Success</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
          <ButtonLink to="/ui">Link</ButtonLink>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 12,
            alignItems: "center",
          }}
        >
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Card>

      <Card title="Avatars">
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <Avatar src="/icon.png" name="Ada Lovelace" size="xs" />
          <Avatar src="/icon.png" name="Ada Lovelace" size="sm" />
          <Avatar name="Grace Hopper" size="md" />
          <Avatar src="/missing.png" name="Alan Turing" size="lg" />
          <Avatar name="Grace Hopper" size="xl" />
        </div>
      </Card>

      <Card title="People" action={<a href="#people">See all</a>}>
        <div style={{ display: "grid", gap: 8 }} id="people">
          <PersonRow
            person={people[0]}
            action={<Button size="sm">Add</Button>}
          />
          <PersonRow
            person={people[1]}
            subtitle="3 mutual friends"
            action={
              <>
                <Button size="sm">Accept</Button>
                <Button size="sm" variant="secondary">
                  Decline
                </Button>
              </>
            }
          />
          <PersonRow person={people[2]} size="sm" />
        </div>
      </Card>

      <Card title="Form">
        <div style={{ display: "grid", gap: 14 }}>
          <Alert>Something went wrong, try again.</Alert>
          <Field id="preview-name" label="Name">
            <input {...inputProps("preview-name")} defaultValue="Ada" />
          </Field>
          <Field id="preview-email" label="Email" error="Enter a valid email">
            <input
              {...inputProps("preview-email", "Enter a valid email")}
              defaultValue="ada@"
            />
          </Field>
          <Field id="preview-bio" label="About you">
            <textarea {...inputProps("preview-bio")} rows={3} />
          </Field>
        </div>
      </Card>

      <Card>
        <EmptyState icon={<FiUsers />} title="No friends yet">
          People you add will show up here.
        </EmptyState>
      </Card>

      <Card title="Modal">
        <Button onClick={() => setOpen(true)}>Open the modal</Button>
        <Modal open={open} onClose={() => setOpen(false)} title="Liked by">
          <div style={{ display: "grid", gap: 8 }}>
            {people.map((person) => (
              <PersonRow key={person.id} person={person} />
            ))}
          </div>
        </Modal>
      </Card>
    </main>
  );
}
