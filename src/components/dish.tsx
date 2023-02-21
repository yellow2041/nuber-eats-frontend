import { restaurant_restaurant_restaurant_menu_options } from "../__generated__/restaurant";
import React from "react";

interface IDishProps {
  id?: number;
  description: string;
  name: string;
  price: number;
  isCustomer?: Boolean;
  orderStarted?: Boolean;
  options?: restaurant_restaurant_restaurant_menu_options[] | null;
  isSelected?: boolean;
  addItemToOrder?: (dishId: number) => void;
  removeFromOrder?: (dishId: number) => void;
  children?: React.ReactNode;
}

export const Dish: React.FC<IDishProps> = ({
  id = 0,
  orderStarted = false,
  description,
  name,
  price,
  isCustomer = false,
  options,
  addItemToOrder,
  removeFromOrder,
  isSelected,
  children: dishOptions,
}) => {
  const onClick = () => {
    if (orderStarted) {
      if (!isSelected && addItemToOrder) {
        addItemToOrder(id);
      }
      if (isSelected && removeFromOrder) {
        removeFromOrder(id);
      }
    }
  };
  return (
    <div
      className={`px-8 pt-4 pb-8 border transition-all ${
        isSelected
          ? "border-gray-800 cursor-not-allowed"
          : "cursor-pointer hover:border-gray-800"
      }`}
    >
      <div className="mb-5">
        <h3 className="text-lg font-medium flex items-center">
          {name}{" "}
          {orderStarted && (
            <button
              className={`ml-3 py-1 px-3 focus:outline-none text-sm text-white ${
                isSelected ? "bg-red-500" : " bg-lime-600"
              }`}
              onClick={onClick}
            >
              {isSelected ? "Remove" : "Add"}
            </button>
          )}
        </h3>
        <h4 className="font-medium">{description}</h4>
      </div>
      <span>{price}원</span>
      {isCustomer && options && options?.length !== 0 && (
        <div>
          <h5 className="mt-8 mb-3 font-medium">Dish Options:</h5>
          <div className="grid gap-2 justify-start">{dishOptions}</div>
        </div>
      )}
    </div>
  );
};
