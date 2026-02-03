'use client';
import { Fragment } from 'react'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'

import Image from 'next/image'
import { useState } from 'react'



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
                name: 'Kids Class (6-10 years)',
                description:
                    'Our martial arts program for kids is thoughtfully crafted to instill discipline, respect, and foundational martial arts skills in a vibrant, fun, and structured environment tailored to young learners. Guided by skilled instructors, children engage in age-appropriate activities that enhance mental focus, physical coordination, and confidence through learning basic techniques like stances, kicks, and punches. The program emphasizes core values such as self-discipline, respect for peers and instructors, and teamwork, fostering personal growth and positive character development. With interactive games, exciting drills, and a supportive atmosphere, we ensure kids stay motivated and enthusiastic, building a strong martial arts foundation while enjoying every moment of their journey.',
                imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-feature-06-detail-02.jpg',
                imageAlt:
                    'Walnut organizer base with pen, sticky note, phone, and bin trays, next to modular drink coaster attachment.',
                links: [
                    { name: '1 Time', href: 'https://gckn66p.pushpress.com/landing/plans/plan_f8ca10cfc98940' },
                    { name: '2 Times', href: 'https://gckn66p.pushpress.com/landing/plans/plan_3ba83644789c40' },
                    { name: '3 Times', href: 'https://gckn66p.pushpress.com/landing/plans/plan_9dc0de876ebe4b' },
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
                    'Our martial arts program for adults and teens is designed to develop self-defense skills and leadership qualities essential for navigating todays world, all within an engaging, structured, and empowering environment. Led by expert instructors, participants learn practical self-defense techniques, including strikes, blocks, and situational awareness, to build confidence and personal safety. The program also cultivates leadership skills through teamwork exercises, goal-setting, and opportunities to guide peers, fostering resilience and decision-making abilities. By blending dynamic training sessions with a focus on discipline and mental clarity, we create a supportive space where adults and teens can hone their physical and mental strength, preparing them to lead and protect themselves in any challenging situation.',

                imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-feature-06-detail-03.jpg',
                imageAlt: 'Walnut organizer base with white polycarbonate trays in the kitchen with various kitchen utensils.',
                links: [
                    { name: '1 Time', href: 'https://gckn66p.pushpress.com/landing/plans/plan_f8ca10cfc98940' },
                    { name: '2 Times', href: 'https://gckn66p.pushpress.com/landing/plans/plan_3ba83644789c40' },
                    { name: '3 Times', href: 'https://gckn66p.pushpress.com/landing/plans/plan_9dc0de876ebe4b' },
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
                    'Yotae is an exhilarating fusion of Taekwondos precision and power with yogas calming flow, designed to inspire high-performing athletes, adults, and teens to build strength, flexibility, and mental focus in a fun, dynamic, and supportive environment. This unique practice combines the discipline of martial arts with the mobility and recovery benefits of yoga, offering an informal yet challenging experience that enhances physical and mental resilience. Every session is crafted to ignite excitement, foster leadership, and empower participants to thrive in todays world with confidence and balance.',
                imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-feature-06-detail-04.jpg',
                imageAlt: 'Walnut organizer system on black leather desk mat on top of white desk.',
                links: [
                    { name: '1 Time', href: 'https://gckn66p.pushpress.com/landing/plans/plan_2fbf93a7430f4d' },
                    { name: '2 Times', href: 'https://gckn66p.pushpress.com/landing/plans/plan_73b6a11224c647' },
                ],
            },
        ],
    },
]

export default function Example() {
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [modalUrl, setModalUrl] = useState<string | null>(null);

  function Modal() {
    if (!isModelOpen) return null;
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-40 p-4">
        <div className="relative bg-white rounded w-full max-w-4xl mx-auto p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
          <button
            onClick={() => setIsModelOpen(false)}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Close
          </button>
          {modalUrl && (
            <iframe
              src={modalUrl}
              title="Sign Up"
              className="w-full h-[700px] mt-4 rounded border"
              loading="lazy"
              sandbox="allow-same-origin allow-forms allow-scripts"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <Modal />
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
                        <Image
                          alt={feature.imageAlt}
                          src={feature.imageSrc}
                          className="aspect-[2/1] w-full rounded-lg bg-gray-100 object-cover sm:aspect-[5/2]"
                          width={500}
                          height={300}
                          unoptimized
                        />
                      </div>
                      <div className="mb-4 flex flex-wrap gap-4 lg:col-span-5">
                        <div className="w-full mb-2 text-sm text-gray-700">
                          Please select the number of times per week you wish to attend from the options below. You will be redirected to our sign up screen.
                        </div>
                        {feature.links.map((link) => (
                          <button
                            key={link.name}
                            onClick={() => {
                              setIsModelOpen(true);
                              setModalUrl(link.href);
                            }}
                            className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 transition"
                          >
                            {link.name}
                          </button>
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
  );
}