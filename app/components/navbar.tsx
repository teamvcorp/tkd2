'use client';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function Navbar() {
    const pathname = usePathname();
    interface IsActiveFn {
        (path: string): string;
    }

    const isActive: IsActiveFn = (path) =>
        pathname === path
            ? 'inline-flex items-center border-b-2 border-indigo-500 px-1 pt-1 text-sm font-medium text-gray-400'
            : 'inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-white-500';
    return (

        <Disclosure as="nav" className="">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between min-w-full">
                    <div className="flex">
                        <div className="ml-2 mr-2 flex items-center md:hidden">
                            {/* Mobile menu button */}
                            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                                <span className="absolute -inset-0.5" />
                                <span className="sr-only">Open main menu</span>
                                <Bars3Icon aria-hidden="true" className="block size-6 group-data-[open]:hidden" />
                                <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-[open]:block" />
                            </DisclosureButton>
                        </div>
                        <Link href="/" className="flex shrink-0 items-center justify-start">
                            <Image
                                alt="Your Company"
                                src="/tkdlogo.png"
                                className="h-14 w-auto"
                                width={250}
                                height={100}
                            />
                        </Link>

                        <div className="hidden md:ml-16 md:flex  md:space-x-8">
                            {/* Current: "border-indigo-500 text-gray-900", Default: "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700" */}
                            <Link
                                href="/"
                                className={`${isActive('/')} border-b-2 hover:border-gray-300 hover:text-gray-700`}
                                data-active={pathname === '/'}
                            >
                                Home
                            </Link>
                            <Link
                                href="/about"
                                className={`${isActive('/about')} border-b-2 hover:border-gray-300 hover:text-gray-700`}
                                data-active={pathname === '/about'}
                            >
                                About
                            </Link>
                            <Link
                                href="/classes"
                                className={`${isActive('/classes')} border-b-2 hover:border-gray-300 hover:text-gray-700`}
                                data-active={pathname === '/classes'}
                            >
                                Classes
                            </Link>
                            <Link
                                href="/contact"
                                className={`${isActive('/contact')} border-b-2 hover:border-gray-300 hover:text-gray-700`}
                                data-active={pathname === '/contact'}
                            >
                                Contact
                            </Link>
                            <Link
                                href="/members"
                                className={`${isActive('/members')} border-b-2 hover:border-gray-300 hover:text-gray-700`}
                                data-active={pathname === '/members'}
                            >
                                Member
                            </Link>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center">
                        <div className="shrink-0">
                            <Link
                                href="/plans"
                                className="relative inline-flex items-center gap-x-1.5 rounded-md bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Sign Up Today!
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <DisclosurePanel className="md:hidden">
                <div className="space-y-1 pb-3 pt-2">
                    {/* Current: "bg-indigo-50 border-indigo-500 text-indigo-700", Default: "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700" */}
                    <DisclosureButton
                        as="a"
                        href="/"
                        className="block border-l-4 border-indigo-500 bg-indigo-50 py-2 pl-3 pr-4 text-base font-medium text-indigo-700 sm:pl-5 sm:pr-6"
                    >
                        Home
                    </DisclosureButton>
                    <DisclosureButton
                        as="a"
                        href="/about"
                        className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 sm:pl-5 sm:pr-6"
                    >
                        About
                    </DisclosureButton>
                    <DisclosureButton
                        as="a"
                        href="/classes"
                        className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 sm:pl-5 sm:pr-6"
                    >
                        Classes
                    </DisclosureButton>
                    <DisclosureButton
                        as="a"
                        href="/contact"
                        className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 sm:pl-5 sm:pr-6"
                    >
                        Contact
                    </DisclosureButton>
                    <DisclosureButton
                        as="a"
                        href="/members"
                        className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 sm:pl-5 sm:pr-6"
                    >
                        Member
                    </DisclosureButton>
                </div>
               
            </DisclosurePanel>
        </Disclosure>
    )
}
