import React from 'react'
import { Modal } from './Modal'

const DEFAULT_WAIVER = `<p>By participating in the Sims For Hire Simulator Challenge ("Event"), you acknowledge and agree to the following:</p>
<p><strong>1. Voluntary Participation.</strong> Your participation is entirely voluntary. You understand the nature of the simulator experience and associated risks.</p>
<p><strong>2. Release of Liability.</strong> You hereby release and hold harmless Sims For Hire, its partners, employees, agents, and sponsors from any and all claims, damages, losses, or expenses arising from your participation.</p>
<p><strong>3. Photo &amp; Media Release.</strong> You consent to being photographed or filmed during the event and grant organizers the right to use such media for promotional purposes.</p>
<p><strong>4. SMS Communications.</strong> By providing your phone number you consent to receive event-related SMS messages. Standard message rates may apply.</p>
<p><strong>5. Rules Compliance.</strong> You agree to follow all operator instructions and event rules at all times during the event.</p>`

interface WaiverModalProps {
  isOpen: boolean
  onClose: () => void
  onAgree: () => void
  waiverHtml?: string | null
}

export function WaiverModal({ isOpen, onClose, onAgree, waiverHtml }: WaiverModalProps) {
  // Note: waiver content is admin-authored from event_config table, not user input.
  // This is the same trusted-content pattern used in the original S4M Leaderboard app.
  const html = waiverHtml || DEFAULT_WAIVER

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Liability Waiver"
      maxWidth="520px"
      footer={
        <>
          <button
            onClick={onClose}
            className="flex-1 py-[14px] font-bold text-[11px] tracking-[2px] uppercase border-[1.5px] bg-transparent cursor-pointer transition-all duration-200 hover:border-black"
            style={{ borderColor: 'var(--border, #C0BFB8)', color: 'var(--black, #0E0E0E)' }}
          >
            Close
          </button>
          <button
            onClick={onAgree}
            className="flex-1 py-[14px] font-bold text-[11px] tracking-[2px] uppercase border-[1.5px] border-black bg-black text-white cursor-pointer transition-all duration-200"
          >
            I Agree &rarr;
          </button>
        </>
      }
    >
      <div
        className="max-h-[280px] overflow-y-auto font-mono text-[11px] leading-[2] [&_strong]:font-bold [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1"
        style={{ color: 'var(--gray, #555)' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Modal>
  )
}
