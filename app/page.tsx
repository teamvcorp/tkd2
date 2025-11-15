'use client'
import Link from 'next/link'
import Image from 'next/image';
import ThreeColumnSection from './components/threeColumn';

export default function Example() {
  return (
    <div className="">

      <div className="mx-auto py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative isolate overflow-hidden px-6 pt-16 justify-betwee sm:rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">

          <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-32 lg:text-left">
            <h2 className="text-balance font-light text-3xl sm:text-5xl md:text-7xl uppercase font-semibold tracking-tight text-white min-w-0 sm:min-w-[700px]">
              Building Discipline & Confidence
            </h2>


            <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
              <Link
                href="/plans"
                className="rounded-md px-20 py-4 text-sm uppercase font-semibold text-white bg-red-500 hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get started
              </Link>


            </div>
          </div>
          <div className="relative mt-16 lg:mt-8">
            <Image
              alt="tkd girl"
              src="/group.png"
              width={1000}
              height={500}
              className=" w-full h-full max-w-none "
            />
          </div>
        </div>
      </div>
      <div className="bg-gray-100">
        <ThreeColumnSection />
      </div>
    </div>
  )
}
