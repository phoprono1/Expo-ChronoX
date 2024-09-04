import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import CreatePost from "@/components/cards/CreatePost";

const BottomSheetContext = createContext<{
  isVisible: boolean; // Thêm isVisible vào context
  openBottomSheet: () => void;
  closeBottomSheet: () => void;
} | null>(null);

export const useBottomSheet = () => {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error("useBottomSheet must be used within a BottomSheetProvider");
  }
  return context;
};

export const BottomSheetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [snapPoints] = useState(["95%"]);

  const openBottomSheet = () => setIsVisible(true);
  const closeBottomSheet = () => setIsVisible(false);

  
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const handleCloseBottomSheet = () => {
    bottomSheetRef.current?.close();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

  return (
    <GestureHandlerRootView>
      <BottomSheetContext.Provider
        value={{ isVisible, openBottomSheet, closeBottomSheet }} // Cung cấp isVisible
      >
        {children}
        <BottomSheet
          snapPoints={snapPoints}
          ref={bottomSheetRef}
          onClose={closeBottomSheet}
          enablePanDownToClose={true}
          index={isVisible ? 0 : -1} // Đặt index để không che khuất bottom tab
          backdropComponent={renderBackdrop}
        >
          <BottomSheetScrollView>
            {isVisible && (
              <CreatePost
                onPost={(post) => {
                  console.log("New Post:", post);
                  handleCloseBottomSheet();
                }}
              />
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      </BottomSheetContext.Provider>
    </GestureHandlerRootView>
  );
};
