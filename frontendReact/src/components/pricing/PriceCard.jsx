
const PriceCard = () => {
  // Define your pricing data
  const price = [
    { name: "Basic", price: 9.99, desc: "This is the basic plan." },
    { name: "Standard", price: 19.99, desc: "This is the standard plan." },
    { name: "Premium", price: 29.99, desc: "This is the premium plan." },
  ];

  return (
    <>
      {price.map((val) => (
        // Use a unique property as the key. Here, we're using the plan name.
        <div className="items shadow" key={val.name}>
          <h4>{val.name}</h4>
          <h1>
            <span>$</span>
            {val.price}
          </h1>
          <p>{val.desc}</p>
          <button className="outline-btn">GET STARTED</button>
        </div>
      ))}
    </>
  );
};

export default PriceCard;
