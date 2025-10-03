import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthModal({ open, onClose }) {
  const { signIn } = useAuth();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    signIn({ name, avatar });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 grid place-items-center">
      <div className="w-[92%] max-w-sm rounded-2xl bg-white p-5 shadow">
        <h3 className="text-lg font-semibold mb-3">Sign in to Qura</h3>
        <form onSubmit={submit} className="grid gap-3">
          <input
            className="rounded-lg border px-3 py-2"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="rounded-lg border px-3 py-2"
            placeholder="Avatar URL (optional)"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-md border">
              Cancel
            </button>
            <button className="px-4 py-2 rounded-md bg-sky-600 text-white">
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
