import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';
import axios from 'axios'

export const ShopContext =  createContext();

const ShopContextProvider = (props) => { 

    const currency = '$';
    const delivery_fee = 10;
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems,setCartItems] = useState(() => {
        // Initialize cart from localStorage for non-logged users
        const savedCart = localStorage.getItem('cartItems');
        return savedCart ? JSON.parse(savedCart) : {};
    }); 
    const [products, setProducts] = useState([]); 
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const navigate = useNavigate();
    const [wishlistItems, setWishlistItems] = useState(() => {
        // Initialize wishlist from localStorage only if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
            const savedWishlist = localStorage.getItem('wishlistItems');
            return savedWishlist ? JSON.parse(savedWishlist) : {};
        }
        return {};
    });

    const addToCart = async (itemId, size, subCategory) => {
        if (!token) {
            toast.error('Log In to add to cart');
            navigate('/login');
            return;
        }

        // Check if size is required for this subcategory
        const sizeRequiredCategories = ['Topwear', 'Bottomwear'];
        const isSizeRequired = sizeRequiredCategories.includes(subCategory);

        if (isSizeRequired && !size) {
            toast.error('Please Select Product Size');
            return;
        }

        // If size is not required, set a default size
        const finalSize = size || 'One Size';

        let cartData = structuredClone(cartItems);

        if (cartData[itemId]) {
            if (cartData[itemId][finalSize]) {
                cartData[itemId][finalSize]+=1 
            } 
            else{
                cartData[itemId][finalSize] = 1;
            }
        }
        else {
            cartData[itemId] = {};
            cartData[itemId][finalSize] = 1;
        }
        setCartItems(cartData);
        
        // Save to localStorage for non-logged users or as backup
        localStorage.setItem('cartItems', JSON.stringify(cartData));

        if (token) {
            try {

                await axios.post(backendUrl + '/api/cart/add', {itemId, size: finalSize}, {headers:{token}})
                
            } 
            catch (error) {
                console.log(error);
                toast.error(error.message)
            }
        }
    }

    const getCartCount = () => {
        let totalCount = 0;
        for(const items in cartItems){
            for(const item in cartItems[items]){
                try {
                    if (cartItems[items][item]>0) {
                        totalCount += cartItems[items][item]; 
                    }
                    
                } catch (error) {
                    
                }
            }
         }
         return totalCount;
    }

    const updateQuantity = async (itemId, size, quantity) => {
            let cartData = structuredClone(cartItems);
            cartData[itemId][size] = quantity;
            setCartItems(cartData);
            
            // Save to localStorage
            localStorage.setItem('cartItems', JSON.stringify(cartData));

            if (token) {
                try {
                    await axios.post(backendUrl + '/api/cart/update', {itemId, size, quantity}, {headers:{token}}) 
                } 
                catch (error) {
                    console.log(error);
                    toast.error(error.message)
                }
            }
    }

    const getCartAmount = () => {
        let totalAmount = 0;
        for(const items in cartItems){
            let itemInfo = products.find((product) => product._id ===items);
            for(const item in cartItems[items]){
            try{
               if (cartItems[items][item] > 0){
                totalAmount += itemInfo.price * cartItems[items][item];
               }
            } catch (error){
        }
    }
    }
    return totalAmount;
    }
     
    const getProductsData = async () =>{
            try {

                const response = await axios.get(backendUrl + '/api/product/list')
                if(response.data.success){
                    setProducts(response.data.products)
                }
                else{
                    toast.error(response.data.message)
                }
                
            } catch (error) {
                console.log(error)
                toast.error(error.message)
            }
    }

    const getUserCart = async (token) => {
        try {
            const response = await axios.post(backendUrl + '/api/cart/get',{}, {headers:{token}})
            if (response.data.success) {
                setCartItems(response.data.cartData)
                // Also save to localStorage as backup
                localStorage.setItem('cartItems', JSON.stringify(response.data.cartData));
            }
        } 
        catch (error) {
            console.log(error);
            toast.error(error.message)
            // If database fails, try to load from localStorage
            const savedCart = localStorage.getItem('cartItems');
            if (savedCart) {
                setCartItems(JSON.parse(savedCart));
            }
        }
    }

    useEffect(() => {
        getProductsData()
    }, [])

    useEffect(() => {
        if (token) {
            getUserCart(token);
            // Load wishlist when user logs in
            const savedWishlist = localStorage.getItem('wishlistItems');
            if (savedWishlist) {
                setWishlistItems(JSON.parse(savedWishlist));
            }
        } else {
            // Clear wishlist when user logs out
            setWishlistItems({});
        }
    }, [token])

    // Merge localStorage cart with database cart when user logs in
    const mergeLocalCartWithDatabase = async () => {
        const localCart = localStorage.getItem('cartItems');
        if (localCart && token) {
            const localCartData = JSON.parse(localCart);
            // If there's local cart data, sync it with the database
            for (const itemId in localCartData) {
                for (const size in localCartData[itemId]) {
                    const quantity = localCartData[itemId][size];
                    if (quantity > 0) {
                        try {
                            await axios.post(backendUrl + '/api/cart/add', 
                                {itemId, size, quantity}, 
                                {headers:{token}}
                            );
                        } catch (error) {
                            console.log('Error syncing cart item:', error);
                        }
                    }
                }
            }
            // After syncing, get the updated cart from database
            getUserCart(token);
        }
    }

    // Add logout function to clear wishlist when user logs out
    const logout = () => {
        setToken('');
        setCartItems({});
        setWishlistItems({}); // Clear wishlist on logout
        localStorage.removeItem('token');
        localStorage.removeItem('cartItems'); // Clear cart on logout
        localStorage.removeItem('wishlistItems'); // Clear wishlist on logout
        navigate('/login');
    };

    const addToWishlist = (itemId) => {
        if (!token) {
            toast.error('Log In to wishlist a product');
            navigate('/login');
            return;
        }
        
        setWishlistItems((prev) => {
            const newWishlistItems = {
                ...prev,
                [itemId]: true
            };
            // Save to localStorage only if user is logged in
            localStorage.setItem('wishlistItems', JSON.stringify(newWishlistItems));
            return newWishlistItems;
        });
    };

    const removeFromWishlist = (itemId) => {
        if (!token) {
            toast.error('Log In to manage your wishlist');
            navigate('/login');
            return;
        }
        
        setWishlistItems((prev) => {
            const newItems = { ...prev };
            delete newItems[itemId];
            // Save to localStorage
            localStorage.setItem('wishlistItems', JSON.stringify(newItems));
            return newItems;
        });
    };

    const isInWishlist = (itemId) => {
        // Only show wishlist status if user is logged in
        if (!token) return false;
        return wishlistItems[itemId] ? true : false;
    };

    const getWishlistCount = () => {
        // Only count wishlist items if user is logged in
        if (!token) return 0;
        return Object.keys(wishlistItems).length;
    }

    const value = { 
        products, currency, delivery_fee,
        search, setSearch, showSearch, setShowSearch,
        cartItems, addToCart,setCartItems, getCartCount, updateQuantity, getCartAmount, navigate, backendUrl,
        setToken, token, wishlistItems, addToWishlist, removeFromWishlist, isInWishlist, getWishlistCount,
        logout
    };

    return (
        <ShopContext.Provider value={value}>
            {props.children}

        </ShopContext.Provider>
    )
}

export default ShopContextProvider