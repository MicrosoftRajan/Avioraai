import React from 'react'
import Image from 'next/image';
import Link from 'next/link';

interface CardProps {
    id:string;
    name:string;
    topic:string;
    subject:string;
    duration:number;
    color:string;
    /** Button label, e.g. completed sessions vs new launch */
    actionLabel?: string;
}
const Cards = ({id, name, topic, subject, color, duration, actionLabel = 'Launch Session'}:CardProps) => {
  return (
    <article className='companion-card' style={{backgroundColor:color}}>
        <div className='flex justify-between items-center'>
            <div className='subject-badge'>{subject}</div>
            <button className='companion-bookmark'>
                <Image
                  src="/icons/bookmark.svg"
                  alt="bookmark"
                  width={13}
                  height={15}
                  className="h-auto w-auto max-w-none shrink-0"
                />
            </button>
        </div>

        <h2 className='text-2xl font-bold'>
            {name}
        </h2>

        <p className='text-sm '>{topic}</p>
        <div className='flex items-center gap-2'>
            <Image
              src="/icons/clock.svg"
              alt="duration"
              width={14}
              height={14}
              className="h-auto w-auto max-w-none shrink-0"
            />
            <p className='text-sm'>{duration} minutes</p>
        </div>

        <Link href={`/companions/${id}`} className='w-full'>
        <button className='btn-primary w-full justify-center'>
            {actionLabel}
        </button>
        </Link>
    </article>
  )
}

export default Cards