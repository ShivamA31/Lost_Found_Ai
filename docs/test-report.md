# Test Report

### Automated Tests
- **AI Service (Pytest)**: Passed. Verified the `all-MiniLM-L6-v2` model loads correctly, embedding shape is exactly 384, and FAISS returns correct semantic rankings.
- **Backend (Jest)**: Passed. Verified scoring logic components for location distance, date decay, and thresholding.
- **Backend E2E**: Not fully executed via Supertest locally due to DB access restrictions, but routes are structured properly.

### Manual Scenarios Verified
- **Scenario 1 (Exact Match)**: Successfully matched items with identical details.
- **Scenario 2 (Semantic Match)**: "black laptop bag" correctly ranked higher than "blue water bottle" against "dark computer backpack".
- **Scenario 3 (Wrong category/far location)**: Dropped below the 0.55 threshold due to component weighting.
- **Search UX**: The 404 search state and loading bar components were built successfully and verified visually in the React component.
