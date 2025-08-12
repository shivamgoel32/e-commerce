import React from 'react';
import ImageViewer from './ImageViewer';
import './ProductContainer.css';

type Product = {
    id: number;
    title: string;
    description: string;
    category: string;
    price: number;
    rating: number;
    thumbnail: string;
    brand: string;
    discountPercentage: number;
};

export default function ProductContainer (props: { products: Product }) {
    const { products } = props;
    const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false);

    const onImageClick = () => {
        setIsImageViewerOpen((prevState)=> !prevState);
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    }

    const getDiscountedPrice = (price: number, discount: number) => {
        return price - (price * discount / 100);
    }

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        
        for (let i = 0; i < fullStars; i++) {
            stars.push(<span key={i} className="star full">★</span>);
        }
        
        if (hasHalfStar) {
            stars.push(<span key="half" className="star half">☆</span>);
        }
        
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
        }
        
        return stars;
    }

    return (
        <div className='productContainer'>
            {products.discountPercentage > 0 && (
                <div className="discount-badge">
                    -{Math.round(products.discountPercentage)}%
                </div>
            )}
            
            <div className="image-container">
                <img 
                    onClick={onImageClick} 
                    className='productContainerImage' 
                    src={products.thumbnail} 
                    alt={products.title}
                />
                <div onClick={() => setIsImageViewerOpen(true)} className="image-overlay">
                    <span className="view-text">👁️ Quick View</span>
                </div>
            </div>
            
            <div className="product-info">
                <div className="product-category">{products.category}</div>
                <h3 className='productContainerTitle'>{products.title}</h3>
                
                <div className="rating-container">
                    <div className="stars">
                        {renderStars(products.rating)}
                    </div>
                    <span className="rating-text">({products.rating})</span>
                </div>
                
                <p className="product-description">{products.description}</p>
                
                <div className="price-container">
                    {products.discountPercentage > 0 ? (
                        <>
                            <span className="original-price">{formatPrice(products.price)}</span>
                            <span className="discounted-price">
                                {formatPrice(getDiscountedPrice(products.price, products.discountPercentage))}
                            </span>
                        </>
                    ) : (
                        <span className="current-price">{formatPrice(products.price)}</span>
                    )}
                </div>
            </div>
            
            <div className='productContainerFooter'>
                <button className='addToCartButton'>
                    <span>🛒</span>
                    Add to Cart
                </button>
            </div>
            
            {isImageViewerOpen && (
                <ImageViewer 
                    src={products.thumbnail} 
                    alt={products.title} 
                    onClose={() => setIsImageViewerOpen(false)} 
                />
            )}
        </div>
    )
}