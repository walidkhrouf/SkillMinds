
import Heading from "../common/heading/Heading"
import PriceCard from "../pricing/PriceCard"
import Hero from "./hero/Hero"
const Hprice = () => {
  return (
    <>
     <Hero />
      <section className='hprice padding'>
        <Heading subtitle='OUR PRICING' title='Pricing & Packages' />
        <div className='price container grid'>
          <PriceCard />
        </div>
      </section>
    </>
  )
}

export default Hprice
