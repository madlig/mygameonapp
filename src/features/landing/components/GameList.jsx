// src/pages/LandingPage/GameList.jsx
import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const GenreIcon = () => ( <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h2zM7 13h.01M7 17h5a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2h2z"></path></svg> );
const SizeIcon = () => ( <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg> );
const WhatsAppIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.433-9.89-9.889-9.89-5.452 0-9.887 4.428-9.888 9.891 0 2.098.61 4.13 1.737 5.932l-.985 3.628 3.743-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.273-.099-.471-.148-.67.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.173.198-.297.297-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.523.074-.797.347-.273.273-1.056 1.024-1.056 2.495 0 1.472 1.08 2.893 1.23 3.091.149.198 2.113 3.235 5.116 4.492.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>);


// Komponen ini sekarang menerima satu 'hit' dari Algolia
const GameList = ({ hit }) => {
    const game = hit;

    const whatsappMessage = encodeURIComponent(`Halo, saya tertarik dengan game "${game.name}". Apakah masih tersedia?`);
    const whatsappLink = `https://wa.me/6285121309829?text=${whatsappMessage}`;
    const shopeeLink = game.shopeeLink || "https://shopee.co.id/mygameon";

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden group flex flex-col h-full">
            <div className="relative w-full aspect-w-4 aspect-h-3 bg-gray-200">
                <LazyLoadImage
                    alt={game.name}
                    src={game.coverArtUrl || '/defaultcoverthumb.webp'}
                    effect="blur"
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex-grow mb-4">
                    <h3 className="text-md font-bold text-gray-800 truncate" title={game.name}>
                        {game.name}
                    </h3>
                    <div className="mt-2 flex items-center text-xs text-gray-600 space-x-4">
                        {game.genre?.[0] && (
                            <span className="flex items-center"><GenreIcon />{game.genre[0]}</span>
                        )}
                        {game.size && (
                            <span className="flex items-center"><SizeIcon />{game.size}</span>
                        )}
                    </div>
                </div>
                <div className="flex">
                    <a href={shopeeLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-4/5 bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors rounded-l-md py-2">
                        Shopee
                    </a>
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-1/5 bg-green-500 text-white hover:bg-green-600 transition-colors rounded-r-md p-2" aria-label="Chat on WhatsApp">
                        <WhatsAppIcon />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default GameList;