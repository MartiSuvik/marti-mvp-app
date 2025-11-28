import React, { useState } from 'react';
import { Icon } from './Icon';

export const VideoPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full max-w-2xl bg-black rounded-lg shadow-2xl overflow-hidden mx-auto relative group cursor-pointer" onClick={handlePlay}>
      <div className="relative aspect-video">
        <img
          alt="Video thumbnail"
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0eFWFQk2mQRPnk4cDTEIv5GyptJjGoBjSRCZEl8ZKP_jUe8ry9sbroSZGxG6CdK2_zuxgSxgx8WvSWSxxRxLisDg7eqFVy5xH7Mor1O1BGA0bI6TCnXKztmR8k1eThKawCOhCmjxnSX1eZL011b2U2OcQHWkawtpavCzxLrIc_BQ364XbzF1oIGLlj114gF4l6hxpj_FN0-hq2QLDY5DtpspQxFHY7tPUpXne_tdUnnIM0gcB0qR8m41Q6BzS2wMNTNsOX_ome44"
        />

        {/* Big Center Play Button */}
        <div className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
          <button className="w-20 h-20 bg-cyan-400/90 rounded-full flex items-center justify-center text-white backdrop-blur-sm shadow-[0_0_30px_rgba(34,211,238,0.4)] group-hover:bg-cyan-400 group-hover:scale-110 transition-all duration-300">
            <Icon name="play_arrow" className="text-6xl ml-2" />
          </button>
        </div>

        {/* Bottom Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center space-x-4">
            <button className="hover:text-cyan-400 transition-colors">
              <Icon name={isPlaying ? "pause" : "play_arrow"} className="text-3xl" />
            </button>
            <span className="text-sm font-medium font-mono">1:31</span>

            {/* Progress Bar */}
            <div className="flex-1 h-1.5 bg-white/30 rounded-full cursor-pointer overflow-hidden">
              <div className="w-3/4 h-full bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)] relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-md transform scale-0 group-hover:scale-100 transition-transform"></div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
                 <button className="hover:text-cyan-400 transition-colors"><Icon name="closed_caption" className="text-2xl" /></button>
                 <button className="hover:text-cyan-400 transition-colors"><Icon name="volume_up" className="text-2xl" /></button>
                 <button className="hover:text-cyan-400 transition-colors"><Icon name="settings" className="text-2xl" /></button>
                 <button className="hover:text-cyan-400 transition-colors"><Icon name="fullscreen" className="text-2xl" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};