'use client';

import {useEffect, useRef, useState} from 'react'
import {cn, configureAssistant, getSubjectColor} from "@/lib/utils";
import {vapi} from "@/lib/vapi.sdk";
import Image from "next/image";
import Lottie, {LottieRefCurrentProps} from "lottie-react";
import soundwaves from '@/constants/soundwaves.json'
import { addToSessionHistory } from '@/lib/actions/companion.actions';
import { jsPDF } from "jspdf";


enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED',
}

const CompanionComponent = ({ companionId, subject, topic, name, userName, userImage, style, voice }: CompanionComponentProps) => {
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [subtitle, setSubtitle] = useState<string>("");

    const lottieRef = useRef<LottieRefCurrentProps>(null);

    useEffect(() => {
        if(lottieRef) {
            if(isSpeaking) {
                lottieRef.current?.play()
            } else {
                lottieRef.current?.stop()
            }
        }
    }, [isSpeaking, lottieRef])

    useEffect(() => {
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE);

        const onCallEnd = () => {
            setCallStatus(CallStatus.FINISHED);
            // add to SessionHistory
            addToSessionHistory(companionId)
        }

        const onMessage = (message: Message) => {
            if(message.type === 'transcript' && message.transcriptType === 'final') {
                const newMessage= { role: message.role, content: message.transcript}
                setMessages((prev) => [newMessage, ...prev])
                setSubtitle(message.transcript)
            }
        }

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);

        const onError = (error: Error) => console.log('Error', error);

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('message', onMessage);
        vapi.on('error', onError);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);

        return () => {
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCallEnd);
            vapi.off('message', onMessage);
            vapi.off('error', onError);
            vapi.off('speech-start', onSpeechStart);
            vapi.off('speech-end', onSpeechEnd);
        }
    }, [companionId]);

    const toggleMicrophone = () => {
        const isMuted = vapi.isMuted();
        vapi.setMuted(!isMuted);
        setIsMuted(!isMuted)
    }

    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING)

        const assistantOverrides = {
            variableValues: { subject, topic, style },
            clientMessages: ["transcript"],
            serverMessages: [],
        }

        // @ts-expect-error vapi.start accepts assistant config + overrides
        vapi.start(configureAssistant(voice, style), assistantOverrides)
    }

    const handleDisconnect = () => {
        setCallStatus(CallStatus.FINISHED)
        vapi.stop()
    }

    const downloadSubtitlesPdf = () => {
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const left = 56;
        const top = 64;
        const pageW = doc.internal.pageSize.getWidth();
        const maxW = pageW - left * 2;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text(`Aviora · ${name}`, left, top);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(40);
        doc.text(`Subject: ${subject}   Topic: ${topic}`, left, top + 22);

        doc.setTextColor(0);
        doc.setFontSize(12);
        const lines: string[] = [];
        // Messages are stored newest-first; export oldest-first
        [...messages].reverse().forEach((m) => {
            const prefix = m.role === "assistant" ? name : userName;
            lines.push(`${prefix}: ${m.content}`);
            lines.push("");
        });

        const body = lines.join("\n");
        const wrapped = doc.splitTextToSize(body || "No subtitles captured yet.", maxW);
        doc.text(wrapped, left, top + 60, { maxWidth: maxW });

        const safe = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        doc.save(`aviora-subtitles-${safe || "session"}.pdf`);
    };

    return (
        <section className="flex flex-col h-[70vh]">
            <section className="flex gap-8 max-sm:flex-col">
                <div className="companion-section">
                    <div className="companion-avatar" style={{ backgroundColor: getSubjectColor(subject)}}>
                        <div
                            className={
                            cn(
                                'absolute transition-opacity duration-1000', callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE ? 'opacity-1001' : 'opacity-0', callStatus === CallStatus.CONNECTING && 'opacity-100 animate-pulse'
                            )
                        }>
                            <Image src={`/icons/${subject}.svg`} alt={subject} width={150} height={150} className="max-sm:w-fit" />
                        </div>

                        <div className={cn('absolute transition-opacity duration-1000', callStatus === CallStatus.ACTIVE ? 'opacity-100': 'opacity-0')}>
                            <Lottie
                                lottieRef={lottieRef}
                                animationData={soundwaves}
                                autoplay={false}
                                className="companion-lottie"
                            />
                        </div>
                    </div>
                    <p className="font-bold text-2xl">{name}</p>
                </div>

                <aside className="w-full max-sm:w-full min-[900px]:w-[380px] rounded-lg border-2 border-black bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-extrabold tracking-wide">
                                Aviora · <span className="font-black">{name}</span>
                            </p>
                            <p className="text-xs font-semibold text-black/70">
                                Subtitles (live)
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={downloadSubtitlesPdf}
                            disabled={messages.length === 0}
                            className={cn(
                                "rounded-lg border-2 border-black bg-[#a5f3fc] px-3 py-2 text-xs font-bold",
                                messages.length === 0 && "opacity-60 cursor-not-allowed"
                            )}
                        >
                            Download PDF
                        </button>
                    </div>

                    <div className="mt-4 rounded-lg border-2 border-black bg-[#fffef5] p-4 min-h-[120px]">
                        <p className="text-sm font-bold">
                            {subtitle ? subtitle : "Start the session to see subtitles here."}
                        </p>
                    </div>

                    <div className="mt-4 grid gap-3">
                        <button
                            className="btn-mic"
                            onClick={toggleMicrophone}
                            disabled={callStatus !== CallStatus.ACTIVE}
                        >
                            <Image
                                src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'}
                                alt="mic"
                                width={36}
                                height={36}
                            />
                            <p className="max-sm:hidden">
                                {isMuted ? 'Mic off' : 'Mic on'}
                            </p>
                        </button>

                        <button
                            className={cn(
                                'rounded-lg py-2 cursor-pointer transition-colors w-full text-white font-bold',
                                callStatus ===CallStatus.ACTIVE ? 'bg-red-700' : 'bg-primary',
                                callStatus === CallStatus.CONNECTING && 'animate-pulse'
                            )}
                            onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}
                        >
                            {callStatus === CallStatus.ACTIVE
                                ? "Stop Session"
                                : callStatus === CallStatus.CONNECTING
                                    ? 'Connecting'
                                    : 'Start Session'
                            }
                        </button>
                    </div>
                </aside>
            </section>

            <section className="transcript">
                <div className="transcript-message no-scrollbar">
                    {messages.map((message, index) => {
                        if(message.role === 'assistant') {
                            return (
                                <p key={index} className="max-sm:text-sm">
                                    {
                                        name
                                            .split(' ')[0]
                                            .replace('/[.,]/g, ','')
                                    }: {message.content}
                                </p>
                            )
                        } else {
                           return <p key={index} className="text-primary max-sm:text-sm">
                                {userName}: {message.content}
                            </p>
                        }
                    })}
                </div>

                <div className="transcript-fade" />
            </section>
        </section>
    )
}

export default CompanionComponent