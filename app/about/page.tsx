import React from "react";

const AboutPage = () => {
    return (
        <main>
      
<section className="bg-gray-100 py-16 px-6">
  <div className="max-w-4xl mx-auto text-center">
    <h2 className="text-4xl font-bold text-black mb-4">About Our School</h2>
    <p className="text-lg text-black mb-8">
      At Storm Lake Taekwondo, we believe martial arts is more than just physical training — it's a pathway to building
      confidence, respect, and lifelong discipline. Since our founding, we've empowered students of all ages to grow stronger,
      inside and out.
    </p>
  </div>

  <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 text-gray-800">
    
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-2xl font-semibold mb-2 text-red-600">Our Mission</h3>
      <p>
        Our mission is to help each student unlock their full potential — physically, mentally, and emotionally. We create
        a supportive and structured environment where students can learn Taekwondo with respect, perseverance, and excellence.
      </p>
    </div>

    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-2xl font-semibold mb-2 text-red-600">Our Approach</h3>
      <p>
        We blend traditional Taekwondo values with modern instruction methods. Whether you're a beginner or a black belt, our
        personalized approach ensures progress at every level.
      </p>
    </div>

    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-2xl font-semibold mb-2 text-red-600">Community-Focused</h3>
      <p>
        We believe in fostering strong community ties. Our school regularly participates in local events, demos, and outreach
        programs to give back and build strong bonds beyond the mat.
      </p>
    </div>

    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-2xl font-semibold mb-2 text-red-600">What Sets Us Apart</h3>
      <p>
        Passionate instruction, an inclusive atmosphere, and a deep-rooted commitment to martial arts excellence make
        Storm Lake Taekwondo a unique and empowering place to train.
      </p>
    </div>

  </div>
</section>

        </main>
    );
};

export default AboutPage;