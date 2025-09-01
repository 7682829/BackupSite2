import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';
import axios from 'axios'

export const ShopContext =  createContext();

const ShopContextProvider = (props) => { 

    const currency = '₹';
    const delivery_fee = 10;
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [cartItems,setCartItems] = useState({}); 
    const [products, setProducts] = useState([]); 
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const navigate = useNavigate();
    const [wishlistItems, setWishlistItems] = useState({});

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

        try {
            await axios.post(backendUrl + '/api/cart/add', {itemId, size: finalSize}, {headers:{token}})
            toast.success('Added to cart');
        } 
        catch (error) {
            console.log(error);
            toast.error(error.message)
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
            }
        } 
        catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    useEffect(() => {
        getProductsData()
    }, [])

    useEffect(() => {
        if (!token && localStorage.getItem('token')) 
        {
            setToken(localStorage.getItem('token'))
            getUserCart(localStorage.getItem('token'))
        }
    },[])

    const addToWishlist = (itemId) => {
        if (!token) {
            toast.error('Log In to add to wishlist');
            navigate('/login');
            return;
        }
        setWishlistItems((prev) => ({
            ...prev,
            [itemId]: true
        }));
        toast.success('Added to wishlist');
    };

    const removeFromWishlist = (itemId) => {
        setWishlistItems((prev) => {
            const newItems = { ...prev };
            delete newItems[itemId];
            return newItems;
        });
        toast.success('Removed from wishlist');
    };

    // Remove from cart utility
    const removeFromCart = (itemId, size) => {
        setCartItems((prev) => {
            const newCart = { ...prev };
            if (newCart[itemId] && newCart[itemId][size]) {
                delete newCart[itemId][size];
                if (Object.keys(newCart[itemId]).length === 0) {
                    delete newCart[itemId];
                }
            }
            return newCart;
        });
        toast.success('Removed from cart');
    };

    const isInWishlist = (itemId) => {
        return wishlistItems[itemId] ? true : false;
    };

    const getWishlistCount = () => {
        return Object.keys(wishlistItems).length;
    }


    // Logout function
    const logout = () => {
        localStorage.removeItem('token');
        setToken('');
        setCartItems({});
        setWishlistItems({});
        toast.success('Logged out successfully!');
        navigate('/login');
    };

    const value = { 
        products, currency, delivery_fee,
        search, setSearch, showSearch, setShowSearch,
        cartItems, addToCart, removeFromCart, setCartItems, getCartCount, updateQuantity, getCartAmount, navigate, backendUrl,
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