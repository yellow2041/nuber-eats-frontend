import React from "react";
import { Link } from "react-router-dom";

interface IRestaurantProps {
  coverImg: string | null;
  name: string;
  categoryName?: string;
  id: string;
}

export const Restaurant: React.FC<IRestaurantProps> = ({
  id,
  coverImg,
  name,
  categoryName,
}) => (
  <Link to={`/restaurant/${id}`}>
    <div className="flex flex-col">
      <div
        style={{
          backgroundImage: `url(${coverImg})`,
        }}
        className="bg-cover bg-center mb-3 py-28"
      ></div>
      <h3 className="text-xlg font-medium">{name}</h3>
      <span className="border-t mt-2 py-2 text-xs opacity-50 border-gray-300">
        {categoryName}
      </span>
    </div>
  </Link>
);
