import {
  SET_SCRIPTS,
  ADD_SCRIPT,
  UPDATE_SCRIPT,
  DELETE_SCRIPT,
  SET_FEEDBACKS,
  APPEND_FEEDBACKS,
  ADD_FEEDBACK,
  UPDATE_FEEDBACK,
  DELETE_FEEDBACK,
} from "../reducer/action";

const initialState = {
  scripts: {
    data: [],
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  },
  feedbacks: {},
};

const flattenFeedbacks = (feedbacks) => {
  const flat = [];
  const flatten = (feedbackList) => {
    feedbackList.forEach((feedback) => {
      const { children, ...rest } = feedback;
      flat.push({ ...rest, children: [] });
      if (children && children.length > 0) flatten(children);
    });
  };
  flatten(feedbacks);
  return flat;
};

const buildFeedbackTree = (feedbacks) => {
  const feedbackMap = new Map();
  const tree = [];

  // Deduplicate feedbacks by keeping the latest version based on id
  const uniqueFeedbacks = Array.from(
    feedbacks.reduce((map, feedback) => {
      map.set(feedback.id, feedback);
      return map;
    }, new Map()).values()
  );

  uniqueFeedbacks.forEach((feedback) => {
    feedback.children = feedback.children || [];
    feedbackMap.set(feedback.id, feedback);
  });

  uniqueFeedbacks.forEach((feedback) => {
    if (feedback.parent_id) {
      const parent = feedbackMap.get(feedback.parent_id);
      if (parent) {
        parent.children.push(feedback);
      } else {
        tree.push(feedback);
      }
    } else {
      tree.push(feedback);
    }
  });

  const sortFeedbacks = (feedbackList) => {
    feedbackList.sort(
      (a, b) =>
        new Date(b.created_at || new Date()) -
        new Date(a.created_at || new Date())
    );
    feedbackList.forEach((feedback) => {
      if (feedback.children && feedback.children.length > 0) {
        sortFeedbacks(feedback.children);
      }
    });
  };

  sortFeedbacks(tree);
  return tree;
};

const scriptReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_SCRIPTS:
      return {
        ...state,
        scripts: action.payload,
      };
    case ADD_SCRIPT:
      return {
        ...state,
        scripts: {
          ...state.scripts,
          data: [action.payload, ...state.scripts.data],
          total: state.scripts.total + 1,
        },
      };
    case UPDATE_SCRIPT:
      return {
        ...state,
        scripts: {
          ...state.scripts,
          data: state.scripts.data.map((item) =>
            item.id === action.payload.id ? action.payload : item
          ),
        },
      };
    case DELETE_SCRIPT:
      return {
        ...state,
        scripts: {
          ...state.scripts,
          data: state.scripts.data.filter((item) => item.id !== action.payload),
          total: state.scripts.total - 1,
        },
        feedbacks: {
          ...state.feedbacks,
          [action.payload]: undefined,
        },
      };
    case SET_FEEDBACKS: {
      const { scriptId, feedbacks: newFeedbacks } = action.payload;
      const currentFeedbacks = state.feedbacks[scriptId] || [];
      const flatCurrent = flattenFeedbacks(currentFeedbacks);
      const flatNew = flattenFeedbacks(newFeedbacks);
      // Deduplicate by combining and keeping unique feedbacks
      const combinedFeedbacks = Array.from(
        new Map(
          [...flatCurrent, ...flatNew].map((feedback) => [feedback.id, feedback])
        ).values()
      );
      const newTree = buildFeedbackTree(combinedFeedbacks);
      return {
        ...state,
        feedbacks: {
          ...state.feedbacks,
          [scriptId]: newTree,
        },
      };
    }
    case APPEND_FEEDBACKS: {
      const { scriptId, feedbacks: newFeedbacks } = action.payload;
      const currentFeedbacks = state.feedbacks[scriptId] || [];
      const flatCurrent = flattenFeedbacks(currentFeedbacks);
      const flatNew = flattenFeedbacks(newFeedbacks);
      // Deduplicate by combining and keeping unique feedbacks
      const combinedFeedbacks = Array.from(
        new Map(
          [...flatCurrent, ...flatNew].map((feedback) => [feedback.id, feedback])
        ).values()
      );
      const newTree = buildFeedbackTree(combinedFeedbacks);
      return {
        ...state,
        feedbacks: {
          ...state.feedbacks,
          [scriptId]: newTree,
        },
      };
    }
    case ADD_FEEDBACK: {
      const { scriptId, feedback } = action.payload;
      const currentFeedbacks = state.feedbacks[scriptId] || [];
      const flatFeedbacks = flattenFeedbacks(currentFeedbacks);
      // Remove any existing feedback with the same id to avoid duplicates
      const filteredFeedbacks = flatFeedbacks.filter((f) => f.id !== feedback.id);
      let updatedFeedbacks = [...filteredFeedbacks];

      if (feedback.parent_id) {
        const parentFeedback = updatedFeedbacks.find(
          (f) => f.id === feedback.parent_id
        );
        if (parentFeedback) {
          parentFeedback.children = [
            ...(parentFeedback.children || []),
            { ...feedback, children: [] },
          ];
        } else {
          console.warn(`Parent feedback ${feedback.parent_id} not found, adding as top-level`);
          updatedFeedbacks = [{ ...feedback, children: [] }, ...updatedFeedbacks];
        }
      } else {
        updatedFeedbacks = [{ ...feedback, children: [] }, ...updatedFeedbacks];
      }

      const newTree = buildFeedbackTree(updatedFeedbacks);
      return {
        ...state,
        feedbacks: {
          ...state.feedbacks,
          [scriptId]: newTree,
        },
      };
    }
    case UPDATE_FEEDBACK:
      return {
        ...state,
        feedbacks: {
          ...state.feedbacks,
          ...Object.keys(state.feedbacks).reduce((acc, scriptId) => {
            acc[scriptId] = buildFeedbackTree(
              flattenFeedbacks(state.feedbacks[scriptId]).map((feedback) =>
                feedback.id === action.payload.feedback.id
                  ? { ...feedback, ...action.payload.feedback }
                  : feedback
              )
            );
            return acc;
          }, {}),
        },
      };
    case DELETE_FEEDBACK:
      return {
        ...state,
        feedbacks: {
          ...state.feedbacks,
          ...Object.keys(state.feedbacks).reduce((acc, scriptId) => {
            const filterFeedbacks = (feedbacks) =>
              feedbacks
                .filter((feedback) => feedback.id !== action.payload.feedbackId)
                .map((feedback) => ({
                  ...feedback,
                  children: feedback.children
                    ? filterFeedbacks(feedback.children)
                    : [],
                }));
            acc[scriptId] = buildFeedbackTree(
              filterFeedbacks(state.feedbacks[scriptId])
            );
            return acc;
          }, {}),
        },
      };
    default:
      return state;
  }
};

export default scriptReducer;