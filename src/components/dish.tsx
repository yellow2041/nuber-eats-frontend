interface IDishProps {
  description: string;
  name: string;
  price: number;
}

export const Dish: React.FC<IDishProps> = ({ description, name, price }) => {
  return (
    <div className="px-8 pt-4 pb-8 border hover:border-gray-800 transition-all">
      <div className="mb-5">
        <h3 className="text-lg font-medium mb-5">{name}</h3>
        <h4 className="font-medium">{description}</h4>
      </div>
      <span>{price}원</span>
    </div>
  );
};
