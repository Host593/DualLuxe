import config from "@/config/config.json";
import React, { useEffect, useRef, useState } from "react";
import "./rangeSlider.css";

function createUrl(path: string, params: URLSearchParams) {
  return `${path}?${params.toString()}`;
}

const RangeSlider = ({
  maxPriceData,
}: {
  maxPriceData: { amount: string; currencyCode: string };
}) => {
  const { currencyCode, currencySymbol } = config.shopify;

  const maxAmount = parseInt(maxPriceData?.amount);
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(maxAmount);

  const rangeRef = useRef<HTMLDivElement>(null);
  const minThumbRef = useRef<HTMLDivElement>(null);
  const maxThumbRef = useRef<HTMLDivElement>(null);
  const rangeLineRef = useRef<HTMLDivElement>(null);

  const searchParams = new URLSearchParams(window.location.search);
  const getMinPrice = searchParams.get("minPrice");
  const getMaxPrice = searchParams.get("maxPrice");

  // Initialize from URL
  useEffect(() => {
    setMinValue(parseInt(getMinPrice || "0"));
    setMaxValue(parseInt(getMaxPrice || maxPriceData?.amount));
  }, [maxPriceData]);

  useEffect(() => {
    updateRangeBar();
  }, [minValue, maxValue]);

  const updateRangeBar = () => {
    if (
      !rangeLineRef.current ||
      !minThumbRef.current ||
      !maxThumbRef.current ||
      !rangeRef.current
    )
      return;

    const rangeWidth = rangeRef.current.getBoundingClientRect().width;
    const minPercent = (minValue / maxAmount) * 100;
    const maxPercent = (maxValue / maxAmount) * 100;

    rangeLineRef.current.style.left = `${minPercent}%`;
    rangeLineRef.current.style.width = `${maxPercent - minPercent}%`;

    minThumbRef.current.style.left = `${minPercent}%`;
    maxThumbRef.current.style.left = `${maxPercent}%`;
  };

  const handleMouseDown = (thumb: "min" | "max") => (e: React.MouseEvent) => {
    e.preventDefault();

    const startX = e.clientX;
    const rangeRect = rangeRef.current?.getBoundingClientRect();
    if (!rangeRect) return;

    const rangeWidth = rangeRect.width;
    const initialMinVal = minValue;
    const initialMaxVal = maxValue;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const dPercent = (dx / rangeWidth) * 100;

      if (thumb === "min") {
        const newPercent = (initialMinVal / maxAmount) * 100 + dPercent;
        const newValue = Math.max(
          0,
          Math.min(maxValue - 1, Math.round((newPercent * maxAmount) / 100))
        );
        setMinValue(newValue);
      } else {
        const newPercent = (initialMaxVal / maxAmount) * 100 + dPercent;
        const newValue = Math.max(
          minValue + 1,
          Math.min(maxAmount, Math.round((newPercent * maxAmount) / 100))
        );
        setMaxValue(newValue);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  function priceChange(min: number, max: number) {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("minPrice", min.toString());
    searchParams.set("maxPrice", max.toString());

    const newUrl = createUrl("/products", searchParams);
    window.location.href = newUrl;
  }

  const showSubmitButton =
    (minValue !== (getMinPrice ? parseInt(getMinPrice) : 0) ||
      maxValue !== (getMaxPrice ? parseInt(getMaxPrice) : maxAmount)) &&
    (minValue !== 0 || maxValue !== maxAmount);

  return (
    <div className="range-slider-container">
      <div className="flex justify-between">
        <p>
          {currencySymbol}
          {minValue} {maxPriceData?.currencyCode || currencyCode}
        </p>
        <p>
          {currencySymbol}
          {maxValue} {maxPriceData?.currencyCode || currencyCode}
        </p>
      </div>

      <div className="range-slider" ref={rangeRef}>
        <div className="slider-track"></div>
        <div className="slider-range" ref={rangeLineRef}></div>
        <div
          className="slider-thumb thumb-min"
          ref={minThumbRef}
          onMouseDown={handleMouseDown("min")}
        ></div>
        <div
          className="slider-thumb thumb-max"
          ref={maxThumbRef}
          onMouseDown={handleMouseDown("max")}
        ></div>
      </div>

      {showSubmitButton && (
        <button
          className="btn btn-sm btn-primary w-full mb-4"
          onClick={() => priceChange(minValue, maxValue)}
        >
          Submit
        </button>
      )}
    </div>
  );
};

export default RangeSlider;
