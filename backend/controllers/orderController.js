
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe'
import razorpay from 'razorpay'

//global variables
const currency = 'inr'
const deliveryCharge = 10

// Helper function to add order to user's orders array
const addOrderToUser = async (userId, orderData) => {
    try {
        await userModel.findByIdAndUpdate(userId, {
            $push: { orders: orderData }
        });
    } catch (error) {
        console.log("Error adding order to user:", error);
    }
}


//gateway initialize
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

//Placing orders using COD method
const placeOrder = async (req,res) => {
    try {

        const {userId, items, amount, address} = req.body;

        const orderData = {
            userId, 
            items,
            address, 
            amount, 
            paymentMethod: "COD", 
            payment:false, 
            date: Date.now()  
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        // Add order to user's orders array
        await addOrderToUser(userId, {
            orderId: newOrder._id,
            items,
            amount,
            address,
            paymentMethod: "COD",
            payment: false,
            status: "Order Placed",
            date: Date.now()
        });

        await userModel.findByIdAndUpdate(userId,{cartData:{}})

        res.json({success:true, message: "Order Placed!"})
    } 
    catch (error) 
    {
        console.log(error);
        res.json({success:false, message: error.message})
    }

}

//Placing orders using Stripe method
const placeOrderStripe = async (req,res) => {
    try {
        
        const {userId, items, amount, address} = req.body;
        const { origin } = req.headers;
        const orderData = {
            userId, 
            items,
            address, 
            amount, 
            paymentMethod: "Stripe", 
            payment:false, 
            date: Date.now()  
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const line_items = items.map((item)=>({
            price_data: {
                currency: currency,
                product_data: {
                    name:item.name
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: 'Delivery Charges'
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment',

        })

        res.json({success:true, session_url: session.url});

    } catch (error) {
        console.log(error);
        res.json({success:false, message: error.message})
    }
}

//verify stripe

const verifyStripe = async(req, res) =>{
     const { orderId, success, userId } = req.body
     console.log('🔍 Stripe verification request:', { orderId, success, userId });

     try {
        if (success === "true") {
            console.log('✅ Payment successful, updating order and clearing cart');
            await orderModel.findByIdAndUpdate(orderId, {payment:true});
            
            // Get the order details to add to user
            const orderDetails = await orderModel.findById(orderId);
            if (orderDetails) {
                await addOrderToUser(userId, {
                    orderId: orderDetails._id,
                    items: orderDetails.items,
                    amount: orderDetails.amount,
                    address: orderDetails.address,
                    paymentMethod: "Stripe",
                    payment: true,
                    status: "Order Placed",
                    date: orderDetails.date
                });
            }
            
            console.log('🧹 Clearing cart in database for user:', userId);
            await userModel.findByIdAndUpdate(userId, {cartData: {}})
            
            // Verify cart was cleared
            const updatedUser = await userModel.findById(userId);
            console.log('📦 User cart after clearing:', updatedUser.cartData);
            
            res.json({success:true});
            
        } else{
            console.log('❌ Payment failed, deleting order');
            await orderModel.findByIdAndDelete(orderId)
            res.json({success:false});
        }
     } catch (error) {
        console.log(error);
        res.json({success:false, message: error.message})
     }
}

//Placing orders using Razorpay method
const placeOrderRazorpay = async (req,res) => {
    try {
        
        const {userId, items, amount, address} = req.body;
        
        const orderData = {
            userId, 
            items,
            address, 
            amount, 
            paymentMethod: "Razorpay", 
            payment:false, 
            date: Date.now()  
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const options = {
            amount: amount * 100,
            currency: currency.toUpperCase(),
            receipt: newOrder._id.toString()
        }

        await razorpayInstance.orders.create(options, (error, order)=>{
                if (error) {
                    console.log(error)
                    return res.json({success:false, message:error})
                }
                res.json({success:true, order})
        })

    } catch (error) {
        console.log(error)
        res.json({success:false, message: error.message})
    }
}

const  verifyRazorpay = async (req,res) => {
    try {
        
        const { userId, razorpay_order_id} = req.body

        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        if(orderInfo.status=='paid'){
            await orderModel.findByIdAndUpdate(orderInfo.receipt,{payment:true})
            
            // Get the order details to add to user
            const orderDetails = await orderModel.findById(orderInfo.receipt);
            if (orderDetails) {
                await addOrderToUser(userId, {
                    orderId: orderDetails._id,
                    items: orderDetails.items,
                    amount: orderDetails.amount,
                    address: orderDetails.address,
                    paymentMethod: "Razorpay",
                    payment: true,
                    status: "Order Placed",
                    date: orderDetails.date
                });
            }
            
            await userModel.findByIdAndUpdate(userId,{cartData:{}})
            res.json({success:true, message:"Payment Successful"})
        } else{
            res.json({success:false, message:"Payment Failed"});
        }
    } catch (error) {
        console.log(error)
        res.json({success:false, message: error.message})
    }
}
//All orders data for Admin Panel 
const allOrders = async (req,res) => {

    try {
        const orders= await orderModel.find({})
        res.json({success:true,orders})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

//READ-ONLY: Get active orders for Wilhelmus hardware interface
const getActiveOrders = async (req,res) => {
    try {
        // Only fetch orders that are not delivered/cancelled - READ ONLY
        const activeOrders = await orderModel.find({
            status: { $nin: ['Delivered', 'Cancelled'] }
        }).sort({ date: -1 }).lean(); // .lean() for read-only optimization
        
        // Transform data for hardware interface
        const formattedOrders = activeOrders.map(order => ({
            orderId: order._id,
            items: order.items,
            status: order.status,
            date: order.date,
            address: order.address
        }));
        
        res.json({success:true, orders: formattedOrders})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

//User order data for Frontend
const userOrders = async (req,res) => {
    try {
        const { userId } =req.body
        const orders = await orderModel.find({userId})
        res.json({success:true,orders})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

//Update order status from Admin Panel
const updateStatus = async (req,res) => {
    try {

        const { orderId, status } = req.body
        await orderModel.findByIdAndUpdate(orderId, { status })
        res.json({success:true, message: 'Status Updated' })

        
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

export {verifyRazorpay,  verifyStripe, placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus, getActiveOrders}



















