import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import WishlistItem from '../components/WishlistItem';

const Wishlist = () => {
  const { 
    wishlistItems, 
    removeFromWishlist,
    products 
  } = useContext(ShopContext);

  const wishlistProducts = Object.keys(wishlistItems)
    .map(id => products.find(item => item._id === id))
    .filter(Boolean); 

  return (
    <div className="px-4 py-8 min-h-[calc(100vh-200px)]">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">My Wishlist</h1>
      {wishlistProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
          <div className="mb-8">
            <svg className="mx-auto h-24 w-24 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">Your wishlist is empty</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
            Save items you love by clicking the heart icon. They'll appear here for you to review and purchase later.
          </p>
          <button 
            onClick={() => window.location.href = '/collection'} 
            className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistProducts.map(product => (
            <WishlistItem 
              key={product._id} 
              id={product._id}
              image={product.image}
              name={product.name}
              price={product.price}
              subCategory={product.subCategory}
              sizes={product.sizes}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;