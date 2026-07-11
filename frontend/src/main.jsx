import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Provider } from 'react-redux'
import store from './store/store.js'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'

// Pages imports
import Homepage from './Pages/Homepage.jsx'
import Login from './Pages/Login.jsx'
import Signup from './Pages/Signup.jsx'
import Dashboard from './Pages/Dashboard.jsx'
import CropGallery from './Pages/CropGallery.jsx'
import ShareCrop from './Pages/ShareCrop.jsx'
import AllReviews from './Pages/AllReviews.jsx'
import ReviewDetail from './Pages/ReviewDetail.jsx'
import AddReview from './Pages/AddReview.jsx'
import EditReview from './Pages/EditReview.jsx'
import QA from './Pages/QA.jsx'
import QuestionDetail from './Pages/QuestionDetail.jsx'
import AgroMarketplace from './Pages/AgroMarketplace.jsx'
import UploadProduct from './Pages/UploadProduct.jsx'
import OTPVerification from './Pages/OTPVerification.jsx'

// Auth wrapper guard
import { AuthLayout } from './components/index.js'

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                path: "/",
                element: <Homepage />,
            },
            {
                path: "/login",
                element: (
                    <AuthLayout authentication={false}>
                        <Login />
                    </AuthLayout>
                ),
            },
            {
                path: "/signup",
                element: (
                    <AuthLayout authentication={false}>
                        <Signup />
                    </AuthLayout>
                ),
            },
            {
                path: "/otp-verification",
                element: <OTPVerification />
            },
            {
                path: "/dashboard",
                element: (
                    <AuthLayout authentication>
                        <Dashboard />
                    </AuthLayout>
                ),
            },
            {
                path: "/crops",
                element: <CropGallery />
            },
            {
                path: "/marketplace",
                element: <AgroMarketplace />
            },
            {
                path: "/upload-product",
                element: (
                    <AuthLayout authentication>
                        <UploadProduct />
                    </AuthLayout>
                )
            },
            {
                path: "/share-crop",
                element: (
                    <AuthLayout authentication>
                        <ShareCrop />
                    </AuthLayout>
                )
            },
            {
                path: "/crops/:id",
                element: <ReviewDetail cropOnly />
            },
            {
                path: "/reviews",
                element: <AllReviews />
            },
            {
                path: "/add-review",
                element: (
                    <AuthLayout authentication>
                        <AddReview />
                    </AuthLayout>
                )
            },
            {
                path: "/reviews/:type/:id",
                element: <ReviewDetail />
            },
            {
                path: "/reviews/:type/:id/edit",
                element: (
                    <AuthLayout authentication>
                        <EditReview />
                    </AuthLayout>
                )
            },
            {
                path: "/qa",
                element: <QA />
            },
            {
                path: "/qa/:id",
                element: <QuestionDetail />
            }
        ],
    },
])

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>
    </React.StrictMode>
)
