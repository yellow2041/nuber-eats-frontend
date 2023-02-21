interface IDishOptionProps {
  isSelected: boolean;
  name: string;
  extra?: number | null;
  dishId: number;
  addOptionToItem: (dishId: number, option: any) => void;
  removeOptionFromItem: (dishId: number, option: any) => void;
}
export const DishOption: React.FC<IDishOptionProps> = ({
  isSelected,
  name,
  extra,
  dishId,
  addOptionToItem,
  removeOptionFromItem,
}) => {
  const onClick = () => {
    if (isSelected) {
      removeOptionFromItem(dishId, name);
    } else {
      addOptionToItem(dishId, name);
    }
  };
  return (
    <span
      onClick={onClick}
      className={`flex items-center border ${
        isSelected ? "border-gray-800" : ""
      }`}
    >
      <span className="mr-2">{name}</span>
      {<span className="text-sm opacity-75">({extra}원)</span>}
    </span>
  );
};
