'use client';

import React, { useEffect, useRef, useState } from 'react';
import Panzoom, { PanzoomObject } from '@panzoom/panzoom';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { routes } from './routes';

interface HospitalMapProps {
  children?: React.ReactNode;
  showControls?: boolean;
}

const Map: React.FC<HospitalMapProps> = ({
  children,
  showControls = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const contentRef = useRef<SVGGElement>(null);
  const panzoomRef = useRef<PanzoomObject | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [currentRoutePath, setCurrentRoutePath] = useState<SVGPathElement | null>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    // Initialize Panzoom
    const panzoom = Panzoom(contentRef.current, {
      maxScale: 50,
      minScale: 0.5,
      step: 0.2,
      smoothScroll: false,
      animate: true,
      duration: 400,
      easing: 'ease-in-out',
    });

    panzoomRef.current = panzoom;

    const svg = svgRef.current;
    if (!svg) return;

    // Event handlers
    const handleWheel = (e: WheelEvent) => panzoom.zoomWithWheel(e);
    const handlePointerDown = (e: PointerEvent) => panzoom.handleDown(e);
    const handleDblClick = (e: MouseEvent) => {
      e.preventDefault();
      panzoom.zoomOut();
    };

    // Add event listeners
    svg.addEventListener('wheel', handleWheel, { passive: false });
    svg.addEventListener('pointerdown', handlePointerDown);
    svg.addEventListener('dblclick', handleDblClick);

    // Cleanup
    return () => {
      svg.removeEventListener('wheel', handleWheel);
      svg.removeEventListener('pointerdown', handlePointerDown);
      svg.removeEventListener('dblclick', handleDblClick);
      panzoom.destroy();
    };
  }, []);

  const focusOnPath = (pathElement: SVGPathElement, padding: number = 0.08) => {
    if (!pathElement || !svgRef.current || !panzoomRef.current) {
      console.error('Required elements not found');
      return;
    }

    panzoomRef.current.reset({ animate: false });

    // Get the bounding box of the path in SVG coordinates
    const bbox = pathElement.getBBox();

    // Add padding to the bounding box
    const paddedWidth = bbox.width * (1 + padding);
    const paddedHeight = bbox.height * (1 + padding);
    const paddedX = bbox.x - (paddedWidth - bbox.width) / 2;
    const paddedY = bbox.y - (paddedHeight - bbox.height) / 2;

    // Calculate the center of the bounding box in SVG coordinates
    const bboxCenterX = paddedX + paddedWidth / 2;
    const bboxCenterY = paddedY + paddedHeight / 2;

    // Get viewBox dimensions
    const viewBox = svgRef.current.viewBox.baseVal;
    const viewBoxWidth = viewBox.width;
    const viewBoxHeight = viewBox.height;

    // Calculate center of viewBox
    const viewBoxCenterX = viewBox.x + viewBoxWidth / 2;
    const viewBoxCenterY = viewBox.y + viewBoxHeight / 2;

    // Calculate translation needed to center the rectangle
    const translateX = viewBoxCenterX - bboxCenterX;
    const translateY = viewBoxCenterY - bboxCenterY;

    // Determine how large the viewBox is compared to padded bbox
    const scaleX = viewBoxWidth / paddedWidth
    const scaleY = viewBoxHeight / paddedHeight

    // Choose the smaller of the 2 scales, keeping 2.8 as the limit
    const targetScale = Math.min(scaleX, scaleY, 2.8)

    // Pan and Zoom
    if (svgRef.current) {
      panzoomRef.current.pan(translateX, translateY)
      svgRef.current.style.transform = `scale(${targetScale})`;
    }
  };

  const resetView = () => {
    // Remove current route path if it exists
    if (currentRoutePath) {
      currentRoutePath.remove();
      setCurrentRoutePath(null);
    }

    // Reset panzoom
    if (panzoomRef.current) {
      panzoomRef.current.reset({ animate: false });
    }

    // Reset SVG transform
    if (svgRef.current) {
      svgRef.current.style.transform = 'translate(0px, 0px) scale(1)';
    }

    setSelectedRoute('');
  };

  const addRoute = (routeKey: string, autoFocus: boolean = true) => {
    // Remove current route path if it exists
    if (currentRoutePath) {
      currentRoutePath.remove();
      setCurrentRoutePath(null);
    }

    // Get route data
    const d = routes[routeKey];
    if (!d) {
      console.error(`Route "${routeKey}" not found`);
      return;
    }

    // Create new path element
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('id', routeKey);
    path.setAttribute('stroke', 'red');
    path.setAttribute('stroke-width', '5');
    path.setAttribute('fill', 'none');
    path.setAttribute('opacity', '0.8');

    // Add animation for visual feedback
    const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animate.setAttribute('attributeName', 'stroke-width');
    animate.setAttribute('values', '5;8;5');
    animate.setAttribute('dur', '2s');
    animate.setAttribute('repeatCount', 'indefinite');
    path.appendChild(animate);

    // Add to content group
    if (contentRef.current) {
      contentRef.current.appendChild(path);
      setCurrentRoutePath(path);
    }

    // Focus on the path if requested
    if (autoFocus) {
      setTimeout(() => {
        focusOnPath(path);
      }, 100);
    }

    return path;
  };

  const handleRouteChange = (value: string) => {
    setSelectedRoute(value);
    if (value) {
      addRoute(value, true);
    } else {
      resetView();
    }
  };


  return (
    <div className="relative w-full h-full">
      {showControls && (
        <div className="absolute top-5 right-5 z-50 bg-background p-3 rounded-lg shadow-accent shadow-lg ring ring-accent">
          <div className="flex flex-col gap-2">
            <Button onClick={resetView} size={'sm'} variant="brand">
              Reset View
            </Button>
            <Select onValueChange={handleRouteChange} value={selectedRoute}>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder="Select a Route..." />
              </SelectTrigger>
              <SelectContent className='h-[40svh]'>
                {Object.keys(routes).map((key) => (
                  <SelectItem key={key} value={key}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      <div id="viewport" className="w-full h-[calc(100svh-68px)] overflow-hidden touch-none">
        <svg
          id="hospital-map"
          viewBox="0 0 1691.6931 1635.8258"
          preserveAspectRatio="xMidYMid meet"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          className="transform transition-transform duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)] scale-100"
          ref={svgRef}
        >
          <g id="map-content" className="[transform-origin:0_0] [transform-box:fill-box] will-change-transform" ref={contentRef}>
            {children}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default Map;
