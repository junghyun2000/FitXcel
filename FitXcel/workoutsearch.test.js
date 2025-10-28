import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import WorkoutSearch from "./app/workoutsearch";
import axios from "axios";

jest.mock("axios");

// Mock react-native-element-dropdown for testing
jest.mock("react-native-element-dropdown", () => {
  const React = require("react");
  const { Text, TouchableOpacity, View } = require("react-native");

  return {
    Dropdown: ({ data, onChange }) => (
      <View>
        {data.map((item) => (
          <TouchableOpacity
            key={item.value}
            onPress={() => onChange(item)}
            testID={`dropdown-option-${item.value}`}
          >
            <Text>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    ),
  };
});

describe("WorkoutSearch Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders header and dropdown correctly", () => {
    const { getByText } = render(<WorkoutSearch />);
    expect(getByText("Search Exercise")).toBeTruthy();
    expect(getByText("Select a Muscle Group")).toBeTruthy();
  });

  test("fetches and displays exercises when a muscle is selected", async () => {
    // mock successful axios response
    axios.get.mockResolvedValueOnce({
      data: [
        { name: "Bench Press" },
        { name: "Push-up" },
      ],
    });

    const { findByText, getByTestId } = render(<WorkoutSearch />);

    const chestOption = getByTestId("dropdown-option-chest");
    fireEvent.press(chestOption);

    expect(await findByText("Bench Press")).toBeTruthy();
    expect(await findByText("Push-up")).toBeTruthy();
  });

  test("shows an error message when API fails", async () => {
    // mock axios rejection
    axios.get.mockRejectedValueOnce(new Error("API Error"));

    const { getByTestId, findByText } = render(<WorkoutSearch />);

    const chestOption = getByTestId("dropdown-option-chest");
    fireEvent.press(chestOption);

    expect(await findByText("Failed to fetch exercises. Try again later.")).toBeTruthy();
  });
});
