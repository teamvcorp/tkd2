import React from 'react';

const ClassesPage: React.FC = () => {
    return (
        <main>

{/* Hero Section */}
<section className="bg-gradient-to-b from-black to-gray-900 text-white py-20 px-6">
  <div className="max-w-5xl mx-auto text-center">
    <h1 className="text-5xl font-bold mb-4">Our Programs</h1>
    <p className="text-lg text-gray-300 max-w-3xl mx-auto">
      Our structured tier system develops students from their very first class through black belt mastery  building not just martial arts skill, but self-control, discipline, and strength of character through our proprietary behaviors program.
    </p>
  </div>
</section>

{/* Tier Programs */}
<section className="bg-gray-100 py-16 px-6">
  <div className="max-w-5xl mx-auto text-center mb-14">
    <h2 className="text-4xl font-bold text-black mb-2">Taekwondo Tiers</h2>
    <p className="text-gray-600">A progressive path from white belt to black belt and beyond.</p>
  </div>

  <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-3">

    {/* Tier 1 */}
    <div className="bg-white p-8 rounded-xl shadow hover:shadow-xl transition duration-300 border-t-4 border-yellow-500">
      <div className="text-sm font-bold uppercase tracking-wider text-yellow-600 mb-1">Tier 1</div>
      <h3 className="text-2xl font-bold text-black mb-1">Foundations</h3>
      <p className="text-sm text-gray-500 mb-4">All Ages &middot; White &ndash; Yellow Belt</p>
      <p className="text-gray-700 mb-4">
        Build the fundamentals of Taekwondo alongside <strong>self-control</strong>, taught through our proprietary behaviors program. We focus on establishing good routines for the development of both physical and mental strength.
      </p>
      <ul className="text-sm text-gray-600 space-y-1">
        <li>&#10003; Taekwondo fundamentals</li>
        <li>&#10003; Self-control &amp; discipline</li>
        <li>&#10003; Routine building</li>
        <li>&#10003; Physical &amp; mental strength</li>
      </ul>
    </div>

    {/* Tier 2 */}
    <div className="bg-white p-8 rounded-xl shadow hover:shadow-xl transition duration-300 border-t-4 border-green-500">
      <div className="text-sm font-bold uppercase tracking-wider text-green-600 mb-1">Tier 2</div>
      <h3 className="text-2xl font-bold text-black mb-1">Development</h3>
      <p className="text-sm text-gray-500 mb-4">Ages 6+ &middot; Green &ndash; Light Blue Belt</p>
      <p className="text-gray-700 mb-4">
        Focused on <strong>self-awareness</strong>, also taught through our proprietary program. Students implement the strength lessons learned in Tier 1 and use self-discipline to diligently practice and refine their skills to this level.
      </p>
      <ul className="text-sm text-gray-600 space-y-1">
        <li>&#10003; Self-awareness training</li>
        <li>&#10003; Applied strength lessons</li>
        <li>&#10003; Self-discipline in practice</li>
        <li>&#10003; Skill refinement</li>
      </ul>
    </div>

    {/* Tier 3 */}
    <div className="bg-white p-8 rounded-xl shadow hover:shadow-xl transition duration-300 border-t-4 border-blue-700">
      <div className="text-sm font-bold uppercase tracking-wider text-blue-700 mb-1">Tier 3</div>
      <h3 className="text-2xl font-bold text-black mb-1">Advanced</h3>
      <p className="text-sm text-gray-500 mb-4">Ages 6+ &middot; Dark Blue &ndash; Red Belt</p>
      <p className="text-gray-700 mb-4">
        Advanced concepts emphasizing <strong>strength of character</strong> from our proprietary behavior program. Students train all Taekwondo skills from beginner to advanced in preparation for entering a mastery course.
      </p>
      <ul className="text-sm text-gray-600 space-y-1">
        <li>&#10003; Strength of character</li>
        <li>&#10003; Full skill spectrum training</li>
        <li>&#10003; Advanced techniques</li>
        <li>&#10003; Mastery preparation</li>
      </ul>
    </div>

    {/* Homeschool Plus */}
    <div className="bg-white p-8 rounded-xl shadow hover:shadow-xl transition duration-300 border-t-4 border-purple-600 md:col-span-3">
      <div className="text-sm font-bold uppercase tracking-wider text-purple-600 mb-1">All Tiers</div>
      <h3 className="text-2xl font-bold text-black mb-1">Homeschool Plus</h3>
      <p className="text-sm text-gray-500 mb-4">Guides Students Through All Tiers</p>
      <p className="text-gray-700 mb-4">
        A revolutionary collaboration between martial arts schools, K&ndash;12 education, and advanced coursework &mdash; with direct parent involvement. Small, community block-sized groups building the leaders of tomorrow.
      </p>
      <a
        href="https://homeschool-plus.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-2 text-purple-600 font-semibold hover:underline"
      >
        Learn more at homeschool-plus.com &rarr;
      </a>
    </div>

  </div>
</section>

{/* Mastery Programs */}
<section className="bg-white py-16 px-6">
  <div className="max-w-5xl mx-auto text-center mb-14">
    <h2 className="text-4xl font-bold text-black mb-2">Mastery Programs</h2>
    <p className="text-gray-600">For dedicated students pursuing the highest levels of Taekwondo excellence.</p>
  </div>

  <div className="max-w-5xl mx-auto grid gap-10 md:grid-cols-2">

    {/* Deputy Black Belt */}
    <div className="bg-gray-50 p-8 rounded-xl shadow hover:shadow-xl transition duration-300 border-l-4 border-gray-800">
      <h3 className="text-2xl font-bold text-black mb-1">Deputy Black Belt</h3>
      <p className="text-sm text-gray-500 mb-4">Pre-Black Belt</p>
      <p className="text-gray-700 mb-4">
        Firmly reinforces all behavior lessons while establishing routines for mastery of skill. This program promotes <strong>true confidence development</strong> through the repetitive application of knowledge.
      </p>
      <ul className="text-sm text-gray-600 space-y-1">
        <li>&#10003; Behavior lesson reinforcement</li>
        <li>&#10003; Mastery-level routines</li>
        <li>&#10003; True confidence building</li>
        <li>&#10003; Applied knowledge</li>
      </ul>
    </div>

    {/* Black Belt */}
    <div className="bg-black text-white p-8 rounded-xl shadow hover:shadow-xl transition duration-300 border-l-4 border-red-600">
      <h3 className="text-2xl font-bold mb-1">Black Belt Program</h3>
      <p className="text-sm text-gray-400 mb-1">Black Belt</p>
      <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-4">5-Year Program &mdash; Renewal required after 5 years</p>
      <p className="text-gray-300 mb-4">
        The solidification of all advanced principles. Students begin the detailed breakdown of each movement - <strong>perfecting the application and delivery</strong> of every Taekwondo skill. This program covers a full <strong>5-year term</strong>; after completion, re-enrollment is required to continue.
      </p>
      <ul className="text-sm text-gray-400 space-y-1">
        <li>&#10003; Advanced principle mastery</li>
        <li>&#10003; Movement-by-movement breakdown</li>
        <li>&#10003; Perfected application &amp; delivery</li>
        <li>&#10003; Complete Taekwondo excellence</li>
        <li>&#10003; Valid for 5 years &mdash; renewal required</li>
      </ul>
    </div>

  </div>
</section>

{/* Schedule */}
<section className="bg-gray-900 text-white py-16 px-6">
  <div className="max-w-5xl mx-auto text-center mb-14">
    <h2 className="text-4xl font-bold mb-2">Class Schedule</h2>
    <p className="text-gray-400">Find the right time for your training.</p>
  </div>

  <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">

    <div className="bg-gray-800 p-6 rounded-xl">
      <h4 className="text-lg font-bold text-red-400 mb-3">Ages 3-5</h4>
      <p className="text-gray-300"><strong className="text-white">Mon &amp; Wed:</strong> 4:30 - 5:30 PM</p>
    </div>

    <div className="bg-gray-800 p-6 rounded-xl">
      <h4 className="text-lg font-bold text-red-400 mb-3">Ages 6+</h4>
      <p className="text-gray-300"><strong className="text-white">Mon, Wed &amp; Fri:</strong> 5:30 - 6:30 PM</p>
    </div>

    <div className="bg-gray-800 p-6 rounded-xl">
      <h4 className="text-lg font-bold text-red-400 mb-3">Adult &amp; Family</h4>
      <p className="text-gray-300"><strong className="text-white">Mon, Wed &amp; Fri:</strong> 6:30 - 7:30 PM</p>
    </div>

    <div className="bg-gray-800 p-6 rounded-xl">
      <h4 className="text-lg font-bold text-red-400 mb-3">Black Belt &amp; Advanced</h4>
      <p className="text-gray-300"><strong className="text-white">Fri:</strong> 6:30 - 7:30 PM</p>
    </div>

    <div className="bg-gray-800 p-6 rounded-xl">
      <h4 className="text-lg font-bold text-red-400 mb-3">Private &amp; Semi-Private</h4>
      <p className="text-gray-300"><strong className="text-white">Tue &amp; Thur:</strong> 5:30 PM</p>
    </div>

    <div className="bg-gray-800 p-6 rounded-xl">
      <h4 className="text-lg font-bold text-red-400 mb-3">Team Training</h4>
      <p className="text-gray-300"><strong className="text-white">Sat:</strong> 10:00 AM - 2:00 PM</p>
      <p className="text-sm text-gray-500 mt-1">On announced weekends</p>
    </div>

    <div className="bg-gray-800 p-6 rounded-xl">
      <h4 className="text-lg font-bold text-red-400 mb-3">Self-Paced Training</h4>
      <p className="text-gray-300"><strong className="text-white">All Days:</strong> 10:00 AM - 3:00 PM</p>
      <p className="text-sm text-gray-500 mt-1">With guidance when requested</p>
    </div>

  </div>
</section>

        </main>
    );
};

export default ClassesPage;