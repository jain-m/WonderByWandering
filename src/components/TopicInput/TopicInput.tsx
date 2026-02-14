/**
 * TopicInput — Starting point UI for local dev mode
 * Replaces Chrome extension session loading with a direct text input.
 * Pre-populated with the demo topic from conversation.md.
 */

import React, { useState } from 'react';
import { useAtlasStore } from '../../store/atlasStore';
import type { Session } from '../../store/atlasStore';
import styles from './TopicInput.module.css';

// Demo topic from conversation.md
const DEMO_TOPIC =
    "I'm wondering about how to design a future work life that feels meaningful.";

export const TopicInput: React.FC = () => {
    const [text, setText] = useState(DEMO_TOPIC);
    const setSession = useAtlasStore((s) => s.setSession);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (trimmed.length < 10) return;

        const session: Session = {
            sessionId: `dev-${Date.now()}`,
            sourceText: trimmed,
            coreQuestion: trimmed,
            pathSuggestions: [],
            demoMode: false,
            createdAt: Date.now(),
        };

        setSession(session);
    };

    const isValid = text.trim().length >= 10;

    return (
        <div className={styles.overlay}>
            <form className={styles.card} onSubmit={handleSubmit}>
                <h1 className={styles.title}>Wonder by Wandering</h1>
                <p className={styles.subtitle}>
                    Enter a topic, question, or passage to explore.
                    <br />
                    The atlas will help you think deeper through branching inquiries.
                </p>

                <div className={styles.inputWrapper}>
                    <textarea
                        className={styles.textarea}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="What are you wondering about?"
                        autoFocus
                    />
                </div>

                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={!isValid}
                >
                    Start Exploring
                </button>

                <p className={styles.hint}>
                    Minimum 10 characters · Powered by Gemini
                </p>
            </form>
        </div>
    );
};

export default TopicInput;
