import { restaurant_restaurant_restaurant_menu_options } from "../__generated__/restaurant";

interface IDishProps {
  id?: number;
  description: string;
  name: string;
  price: number;
  isCustomer?: Boolean;
  orderStarted?: Boolean;
  options?: restaurant_restaurant_restaurant_menu_options[] | null;
  addItemToOrder?: (dishId: number) => void;
  removeFromOrder?: (dishId: number) => void;
  isSelected?: boolean;
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
      onClick={onClick}
      className={`px-8 pt-4 pb-8 border transition-all ${
        isSelected
          ? "border-gray-800 cursor-not-allowed"
          : "cursor-pointer hover:border-gray-800"
      }`}
    >
      <div className="mb-5">
        <h3 className="text-lg font-medium mb-5">{name}</h3>
        <h4 className="font-medium">{description}</h4>
      </div>
      <span>{price}원</span>
      {isCustomer && options && options?.length !== 0 && (
        <div>
          <h5 className="mt-5 mb-3 font-medium">Dish Options:</h5>
          {options?.map((option, index) => (
            <span className="flex items-center" key={index}>
              <h6 className="mr-2">{option.name}</h6>
              <h6 className="text-sm opacity-75">({option.extra}원)</h6>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
