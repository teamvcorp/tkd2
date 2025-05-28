import { Fragment } from 'react'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import Link from 'next/link'

const tabs = [
    {
        name: 'Little Kids (3-6 years)',
        features: [
            {
                name: 'Little Kids Classes',
                description:
                    'Our kids’ classes at Taekwondo of Storm lake are designed to foster discipline, respect, and physical fitness in a fun and safe environment. By integrating Applied Behavior Analysis (ABA) principles, we create a structured and supportive setting that promotes positive behavioral outcomes, helping children build confidence, focus, and social skills. Through engaging activities and expert instruction, our programs empower young martial artists to thrive both on and off the mat.',
                imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-feature-06-detail-01.jpg',
                imageAlt: 'Maple organizer base with slots, supporting white polycarbonate trays of various sizes.',
                links: [
                    { name: '1 Time', href: 'https://gckn66p.pushpress.com/landing/plans/plan_f8ca10cfc98940' },
                    { name: '2 Times', href: 'https://gckn66p.pushpress.com/landing/plans/plan_3ba83644789c40' },
                   
                ],
            },
        ],
    },
    {
        name: 'Kids (6-10 years)',
        features: [
            {
                name: 'Natural wood options',
                description:
                    'Organize has options for rich walnut and bright maple base materials. Accent your desk with a contrasting material, or match similar woods for a calm and cohesive look. Every base is hand sanded and finished.',
                imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-feature-06-detail-02.jpg',
                imageAlt:
                    'Walnut organizer base with pen, sticky note, phone, and bin trays, next to modular drink coaster attachment.',
                links: [
                    { name: 'View Materials', href: '/materials' },
                ],
            },
        ],
    },
    {
        name: 'Teen & Adult (11+ years)',
        features: [
            {
                name: 'Helpful around the home',
                description:
                    "Our customers use Organize throughout the house to bring efficiency to many daily routines. Enjoy Organize in your workspace, kitchen, living room, entry way, garage, and more. We can't wait to see how you'll use it!",
                imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-feature-06-detail-03.jpg',
                imageAlt: 'Walnut organizer base with white polycarbonate trays in the kitchen with various kitchen utensils.',
                links: [
                    { name: 'See Use Cases', href: '/use-cases' },
                ],
            },
        ],
    },
    {
        name: 'Yotae',
        features: [
            {
                name: "Everything you'll need",
                description:
                    'The Organize base set includes the pen, phone, small, and large trays to help you group all your essential items. Expand your set with the drink coaster and headphone stand add-ons.',
                imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-feature-06-detail-04.jpg',
                imageAlt: 'Walnut organizer system on black leather desk mat on top of white desk.',
                links: [
                    { name: 'What’s Included', href: '/included' },
                    { name: 'Add-ons', href: '/add-ons' },
                ],
            },
        ],
    },
]

export default function Example() {
    return (
        <div className="bg-white">
            <section aria-labelledby="features-heading" className="mx-auto max-w-7xl py-32 sm:px-2 lg:px-8">
                <div className="mx-auto max-w-2xl px-4 lg:max-w-none lg:px-0">
                    <div className="max-w-3xl">
                        <h2 id="features-heading" className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                           Membership Plans
                        </h2>
                        <p className="mt-4 text-gray-500">
                            Please explore our plans below they are organized by the class types we offer. Each class type has its own unique features and benefits, allowing you to choose the one that best fits your needs.
                        </p>
                    </div>

                    <TabGroup className="mt-4">
                        <div className="-mx-4 flex overflow-x-auto sm:mx-0">
                            <div className="flex-auto border-b border-gray-200 px-4 sm:px-0">
                                <TabList className="-mb-px flex space-x-10">
                                    {tabs.map((tab) => (
                                        <Tab
                                            key={tab.name}
                                            className="whitespace-nowrap border-b-2 border-transparent py-6 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 data-[selected]:border-indigo-500 data-[selected]:text-indigo-600"
                                        >
                                            {tab.name}
                                        </Tab>
                                    ))}
                                </TabList>
                            </div>
                        </div>

                        <TabPanels as={Fragment}>
                            {tabs.map((tab) => (
                                <TabPanel key={tab.name} className="space-y-16 pt-10 lg:pt-16">
                                    {tab.features.map((feature) => (
                                        <div key={feature.name} className="flex flex-col-reverse lg:grid lg:grid-cols-12 lg:gap-x-8">
                                            <div className="mt-6 lg:col-span-5 lg:mt-0">
                                                <h3 className="text-lg font-medium text-gray-900">{feature.name}</h3>
                                                <p className="mt-2 text-sm text-gray-500">{feature.description}</p>
                                            </div>
                                   
                                            <div className="lg:col-span-7">
                                                <img
                                                    alt={feature.imageAlt}
                                                    src={feature.imageSrc}
                                                    className="aspect-[2/1] w-full rounded-lg bg-gray-100 object-cover sm:aspect-[5/2]"
                                                />
                                            </div>
                                                     <div className="mb-4 flex flex-wrap gap-4 lg:col-span-5">
                                                        <div className="w-full mb-2 text-sm text-gray-700">
                                                            Please select the number of times per week you wish to attend from the options below. You will be redirected to our sign up screen.
                                                        </div>
                                                {feature.links.map((link) => (
                                                    <Link
                                                        key={link.name}
                                                        href={link.href}
                                                        target='_blank'
                                                        rel="noopener noreferrer"
                                                        className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 transition"
                                                    >
                                                        {link.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </TabPanel>
                            ))}
                        </TabPanels>
                    </TabGroup>
                </div>
            </section>
        </div>
    )
}
