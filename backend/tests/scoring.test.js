const scoringService = require('../src/services/scoringService');

describe('Scoring Service', () => {
  it('calculates score correctly for same location and category', () => {
    const lost = { category_id: 1, location_id: 2, color: 'black', type: 'LOST', date_occurred: '2026-10-01' };
    const found = { category_id: 1, location_id: 2, color: 'black', type: 'FOUND', date_occurred: '2026-10-02' };
    
    const res = scoringService.calculateScore(lost, found, 0.9);
    
    expect(res.categoryScore).toBe(1);
    expect(res.locationScore).toBe(1);
    expect(res.colorScore).toBe(1);
    expect(res.dateScore).toBeGreaterThan(0.8);
    expect(res.finalScore).toBeGreaterThan(0.85); // 0.6*0.9 + 0.15*1 + 0.1*1 + 0.05*1 + 0.1*0.86
  });

  it('rejects if found before lost by more than grace', () => {
    const lost = { category_id: 1, location_id: 2, color: 'black', type: 'LOST', date_occurred: '2026-10-05' };
    const found = { category_id: 1, location_id: 2, color: 'black', type: 'FOUND', date_occurred: '2026-10-01' };
    
    const res = scoringService.calculateScore(lost, found, 0.9);
    
    expect(res.dateScore).toBe(0);
  });
});
