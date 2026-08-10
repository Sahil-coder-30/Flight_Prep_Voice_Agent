import { MessageSquareMore, Mic, Speaker, TriangleAlert } from 'lucide-react';
import type { ChatMessage } from '../api';

interface TranscriptPanelProps {
  messages: ChatMessage[];
  isBusy: boolean;
}

const toneLabel = {
  normal: 'Readback',
  clarification: 'Clarification',
  correction: 'Correction',
} as const;

const toneIcon = {
  normal: <Mic size={15} />,
  clarification: <Speaker size={15} />,
  correction: <TriangleAlert size={15} />,
} as const;

export function TranscriptPanel({ messages, isBusy }: TranscriptPanelProps) {
  return (
    <section className="panel panel--stack panel--transcript">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Transcript</p>
          <h2>Live radio turns</h2>
        </div>
        <MessageSquareMore size={18} />
      </div>

      <div className="transcript-list" aria-live="polite">
        {messages.map((message) => (
          <article key={`${message.timestamp}-${message.stepId}-${message.role}`} className={`transcript-message transcript-message--${message.role} transcript-message--${message.tone}`}>
            <div className="transcript-message__meta">
              <span className="transcript-message__speaker">{message.role === 'pilot' ? 'Pilot' : 'Controller'}</span>
              <span className="transcript-message__tone">
                {toneIcon[message.tone]}
                {toneLabel[message.tone]}
              </span>
            </div>
            <p>{message.text}</p>
          </article>
        ))}

        {isBusy ? (
          <div className="transcript-message transcript-message--busy">
            <span className="pulse-dot" />
            Controller is working the next line...
          </div>
        ) : null}
      </div>
    </section>
  );
}
