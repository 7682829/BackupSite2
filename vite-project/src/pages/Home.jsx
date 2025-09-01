import React from 'react'
import Hero from '../components/Hero'
import BestSeller from '../components/BestSeller'
import NewsletterBox from '../components/NewsletterBox'
import { TextParallaxContentExample } from "../components/TextParallaxContent";
import BentoGridDemo from "../components/BentoGridDemo";
import { TestimonialsSection } from '../components/TestimonialsSection';

const Home = () => {
  return (
    <div className="-mt-[70px]">
      <Hero/>
      <br />
      <TextParallaxContentExample />
      <br />
      <BentoGridDemo />
      <BestSeller/>
      <div className="py-16">
        <TestimonialsSection />
      </div>
      <div className="-mx-4 sm:-mx-[5vw] md:-mx-[7vw] lg:-mx-[9vw]">
        <NewsletterBox/>
      </div>
    </div>
  )
}

export default Home;
