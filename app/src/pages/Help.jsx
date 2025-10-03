export default function Help() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <span className="text-2xl font-bold mb-6 text-sky-700">Help & </span>{" "}
      <span className="text-2xl font-bold mb-6 text-slate-900">FAQ</span>
      <p className="text-slate-700 mb-6">Quick answers for common questions.</p>

      <div className="space-y-6">
        <section>
          <h2 className="font-semibold mb-2">Create or join a meeting</h2>
          <ol className="list-decimal pl-5 text-slate-700 space-y-1">
            <li>On Home, click <b>New meeting</b> or paste a code and press <b>Join</b>.</li>
            <li>Share your link with participants.</li>
          </ol>
        </section>
        <section>
          <h2 className="font-semibold mb-2">Mic/Camera</h2>
          <p className="text-slate-700">Use the bottom controls to mute/unmute and turn camera on/off. If the device light stays on, reload permissions or system privacy settings.</p>
        </section>
        <section>
          <h2 className="font-semibold mb-2">Present (Screen share)</h2>
          <p className="text-slate-700">Click <b>Present now</b> and choose Screen/Window/Tab. Works best on desktop browsers over HTTPS.</p>
        </section>
        <section>
          <h2 className="font-semibold mb-2">Need more help?</h2>
          <p className="text-slate-700">Email us at <a className="text-sky-700 underline" href="mailto:support@qura.meet">support@qura.meet</a>.</p>
        </section>
      </div>
    </div>
  )
}
