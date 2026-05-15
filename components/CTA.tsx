import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const CTA = () => {
  return (
    <section className='cta-section'>
      <div className='cta-badge'>Start learning Your ways</div>
      <h2 className='text-3xl font-bold'>Build Your Persionalize Learning</h2>
      <p>Pick a name, subject, Voice, & personality - and start learning through voice conversation that feel neutral and fun</p>
      <Image
        src="/images/cta.svg"
        alt="Start learning with Aviora"
        width={362}
        height={232}
        priority
      />
      <button className='btn-primary'>
        <Image
          src="/icons/plus.svg"
          alt="plus"
          width={12}
          height={12}
          className="h-auto w-auto max-w-none shrink-0"
        />
        <Link href="/companions/new">
        <p>Build Your Future Together</p>
        </Link>
      </button>
    </section>
  )
}

export default CTA