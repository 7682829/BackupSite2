import React from 'react'

const NewsletterBox = () => {

  const onSubmitHandler = (event) => {
    event.preventDefault();
  }

  return (
    <div className="w-full py-12 sm:py-20">
      <div className="max-w-6xl mx-auto text-center px-4 sm:px-6">
        <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-800 dark:text-white">
          Subscribe now and get 15% off!!
        </p>
        <p className="text-gray-500 dark:text-gray-300 mt-3 sm:mt-4 text-base sm:text-lg max-w-2xl mx-auto">
          Be the first to know about our latest collections and exclusive offers.
        </p>

        <form
          onSubmit={onSubmitHandler}
          className="w-full sm:w-4/5 md:w-2/3 lg:w-1/2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2 mx-auto mt-8 sm:mt-10 border border-gray-300 dark:border-gray-600 p-2 rounded-lg bg-white dark:bg-gray-900"
        >
          <input
            className="flex-1 outline-none bg-transparent text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-3 py-3 rounded-md"
            type="email"
            placeholder="Enter your email"
            required
          />
          <button
            type="submit"
            className="bg-black dark:bg-white text-white dark:text-black text-sm sm:text-base font-medium px-6 sm:px-8 py-3 rounded-md transition-all duration-300 hover:scale-105 whitespace-nowrap"
          >
            SUBSCRIBE
          </button>
        </form>
      </div>
    </div>
  )
}

export default NewsletterBox
