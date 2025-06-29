import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ButtonPropsからchildrenを除外した型を定義します。
// このボタンは常にアイコンを表示するため、childrenを外部から渡す必要はありません。
type EditButtonProps = Omit<React.ComponentProps<typeof Button>, "children">;

const EditButton = React.forwardRef<HTMLButtonElement, EditButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size="sm"
        className={cn(
          "bg-white text-black border border-gray-300 hover:bg-gray-100 font-bold py-1 px-2 rounded-lg shadow-md transition-all duration-200 ease-in-out transform hover:scale-105 flex-shrink-0",
          className
        )}
        {...props}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">編集</span>
      </Button>
    );
  }
);
EditButton.displayName = "EditButton";

export { EditButton };
