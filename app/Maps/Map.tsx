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

interface Routes {
  [key: string]: string;
}

const routes: Routes = {
  "M-1": "M 1315.3984,1367.7323 H 968.94908 v -99.1761 H 908.25845 V 1088.7403 H 1140.7768 V 921.35522",
  "M-2": "M 1315.3984,1367.7323 H 968.94908 v -99.1761 H 908.25845 V 1088.7403 H 1140.7768 V 921.35522",
  "M-3": "M 1315.6667,1368.4143 H 968.36184 v -98.7815 H 150.3549 v -50.915",
  "M-4": "M 1315.6714,1367.8591 H 969.37408 v -97.7482 H 374.69622 v -12.4645",
  "M-5": "M 1316.0575,1369.5367 H 969.85197 V 1269.3315 H 259.57165 v -195.7333 h 71.84633 V 866.69384 h -22.97533",
  "MICU": "M 1315.2737,1368.9202 H 968.93813 v -99.9618 H 907.01676 V 795.35209 h -94.23421",

  "S-1": "M 1315.3984,1367.7323 H 968.94908 v -99.1761 H 908.25845 V 1088.7403 H 1140.7768 V 921.35522",
  "S-2": "M 1315.3984,1367.7323 H 968.94908 v -99.1761 H 908.25845 V 1088.7403 H 1140.7768 V 921.35522",
  "S-3": "M 1315.2737,1368.9202 H 968.93813 v -99.9618 H 907.01676 V 795.35209 h -94.23421",
  "S-4": "M 1315.2737,1368.9202 H 968.93813 v -99.9618 H 907.01676 V 795.35209 h -94.23421",
  "S-5": "M 1315.2737,1368.9202 H 968.93813 v -99.9618 H 907.01676 V 795.35209 h -94.23421",
  "S-6": "M 1315.2737,1368.9202 H 968.93813 v -99.9618 H 907.01676 V 795.35209 h -94.23421",
  "OT-Complex": "M 1315.3984,1367.7323 H 968.94908 v -99.1761 H 908.25845 V 1088.7403 H 1140.7768 V 921.35522",
  "SICU": "M 1317.0383,1370.5862 H 968.46632 V 1270.5195 H 906.96435 V 724.03956 h -93.84244",

  "Peds-1": "M 1315.6327,1368.4301 H 969.81154 v -100.3325 h -64.05985 v -178.212 H 1335.2012 V 847.26385 h 193.7513 v 9.08722",
  "Peds-2": "M 1316.0575,1369.5367 H 969.85197 V 1269.3315 H 259.57165 v -195.7333 h 71.84633 V 866.69384 h -22.97533",
  "Peds-3": "M 1316.0575,1369.5367 H 969.85197 V 1269.3315 H 259.57165 v -195.7333 h 71.84633 V 866.69384 h -22.97533",
  "Peds-Surgery": "M 1316.0575,1369.5367 H 969.85197 V 1269.3315 H 259.57165 v -195.7333 h 71.84633 V 866.69384 h -22.97533",
  "Peds-Emergency": "M 1315.3072,1368.373 H 968.76059 v -98.805 H 258.31331 v -195.9358 h 71.89351 v -313.62 h 29.05562",
  "Peds-Cardiology": "M 1316.0575,1369.5367 H 969.85197 V 1269.3315 H 259.57165 v -195.7333 h 71.84633 V 866.69384 h -22.97533",
  "Peds-ICU": "M 1316.0575,1369.5367 H 969.85197 V 1269.3315 H 259.57165 v -195.7333 h 71.84633 V 866.69384 h -22.97533",
  "Neonatal-ICU": "M 1316.0575,1369.5367 H 969.85197 V 1269.3315 H 259.57165 v -195.7333 h 71.84633 V 866.69384 h -22.97533",

  "Gyne-1": "M 1315.2737,1368.9202 H 968.93813 v -99.9618 H 907.01676 V 795.35209 h -94.23421",
  "Gyne-2": "M 1315.2737,1368.9202 H 968.93813 v -99.9618 H 907.01676 V 795.35209 h -94.23421",
  "Gyne-3": "M 1315.2737,1368.9202 H 968.93813 v -99.9618 H 907.01676 V 795.35209 h -94.23421",
  "Gyne-OT": "M 1315.2737,1368.9202 H 968.93813 v -99.9618 H 907.01676 V 795.35209 h -94.23421",
  "Gyne-ER": "M 1315.2737,1368.9202 H 968.93813 v -99.9618 H 907.01676 V 795.35209 h -94.23421",

  "Eye-1": "M 1315.7645,1368.4279 H 968.73323 v -99.7534 H 257.73716 v -196.185 h 74.60763 V 649.37605 H 197.37703 v -27.83266",
  "Eye-2": "M 1315.7645,1368.4279 H 968.73323 v -99.7534 H 257.73716 v -196.185 h 74.60763 V 649.37605 H 197.37703 v -27.83266",
  "Trauma Center": "M 1315.7645,1368.4279 H 968.73323 v -99.7534 H 257.73716 v -196.185 h 74.60763 V 649.37605 H 197.37703 v -27.83266",

  "ENT-1": "M 1315.6714,1367.8591 H 969.37408 v -97.7482 H 374.69622 v -12.4645",
  "ENT-2": "M 1315.6714,1367.8591 H 969.37408 v -97.7482 H 374.69622 v -12.4645",

  "Ortho-1": "M 1315.8608,1368.6102 H 969.0751 V 1268.5628 H 668.32963 v -11.7335",
  "Ortho-2": "M 1315.3978,1368.938 H 968.88338 v -99.5865 H 685.78134 v 45.6691",
  "Ortho-OT": "M 1315.3978,1368.938 H 968.88338 v -99.5865 H 685.78134 v 45.6691",
  "Rehabiliation Center": "M 1315.3978,1368.938 H 968.88338 v -99.5865 H 685.78134 v 45.6691",

  "Cardiology": "M 1316.0575,1369.5367 H 969.85197 V 1269.3315 H 259.57165 v -195.7333 h 71.84633 V 866.69384 h -22.97533",
  "Cardiac Surgery": "M 1315.8705,1367.5482 H 968.49077 v -98.84 H 258.77663 v -195.8918 h 72.3642 V 871.20308 h 28.15063",

  "Dermatology": "M 1316.0575,1369.5367 H 969.85197 V 1269.3315 H 259.57165 v -195.7333 h 71.84633 V 866.69384 h -22.97533",
  "Plastic Surgery": "M 1315.2737,1368.9202 H 968.93813 v -99.9618 H 907.01676 V 795.35209 h -94.23421",

  "Psychiatry": "M 1316.0575,1369.5367 H 969.85197 V 1269.3315 H 259.57165 v -195.7333 h 71.84633 V 866.69384 h -22.97533",

  "Neurology": "M 1315.9182,1368.6358 H 969.70947 v -100.404 h -710.2834 v -194.8761 h 72.58069 V 650.12821 h 272.03373 v 20.5859",
  "Neurosurgery": "M 1315.7645,1368.4279 H 968.73323 v -99.7534 H 257.73716 v -196.185 h 74.60763 V 649.37605 H 197.37703 v -27.83266",
  "Stroke": "M 1315.9182,1368.6358 H 969.70947 v -100.404 h -710.2834 v -194.8761 h 72.58069 V 650.12821 h 272.03373 v 20.5859",
  "Imaging": "M 1315.9182,1368.6358 H 969.70947 v -100.404 h -710.2834 v -194.8761 h 72.58069 V 650.12821 h 272.03373 v 20.5859",

  "Infectious Disease": "M 1315.2737,1368.9202 H 968.93813 v -99.9618 H 907.01676 V 795.35209 h -94.23421",

  "Anesthesia": "M 1317.0383,1370.5862 H 968.46632 V 1270.5195 H 906.96435 V 724.03956 h -93.84244",

  "SIUT-Emergency": "M 1315.2737,1368.9202 H 968.93813 v -99.9618 H 907.01676 V 795.35209 h -94.23421",

  "Civil-Emergency": "M 1316.3196,1369.3187 H 968.82343 v -99.4409 H 259.02354 V 1073.5607 H 332.9696 V 656.13705 h 356.74234",

  "OPDs": "M 1315.8487,1369.7986 H 968.96935 V 1269.7454 H 260.60989 v -197.589 h 71.4696 V 648.14661 h 77.34329 v -50.98256"
};

interface HospitalMapProps {
  // You can pass the SVG content as children or as a prop
  children?: React.ReactNode;
  // Optional: initial route to display
  initialRoute?: string;
  // Optional: show controls
  showControls?: boolean;
}

const Map: React.FC<HospitalMapProps> = ({
  children,
  initialRoute,
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

  // Initialize with initial route if provided
  useEffect(() => {
    if (initialRoute && routes[initialRoute]) {
      addRoute(initialRoute);
    }
  }, [initialRoute]);

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
            <Button onClick={resetView} size={'sm'} className='bg-[#00ACE6] hover:bg-[#008fbf]'>
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
