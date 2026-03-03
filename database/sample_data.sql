-- Sample data for testing the F1 Archive website

-- Insert sample seasons
INSERT INTO seasons (year) VALUES 
(2024), (2023), (2022), (2021), (2020);

-- Insert sample teams
INSERT INTO teams (name, logo_url, car_image_url, is_active, championships) VALUES
('Red Bull Racing', 'https://via.placeholder.com/200x100?text=Red+Bull', 'https://via.placeholder.com/600x300?text=RB20', true, 6),
('Mercedes', 'https://via.placeholder.com/200x100?text=Mercedes', 'https://via.placeholder.com/600x300?text=W15', true, 8),
('Ferrari', 'https://via.placeholder.com/200x100?text=Ferrari', 'https://via.placeholder.com/600x300?text=SF-24', true, 16),
('McLaren', 'https://via.placeholder.com/200x100?text=McLaren', 'https://via.placeholder.com/600x300?text=MCL38', true, 8),
('Aston Martin', 'https://via.placeholder.com/200x100?text=Aston+Martin', 'https://via.placeholder.com/600x300?text=AMR24', true, 0);

-- Insert sample drivers
INSERT INTO drivers (name, number, dob, image_url) VALUES
('Max Verstappen', '1', '1997-09-30', 'https://via.placeholder.com/300x400?text=Max+Verstappen'),
('Lewis Hamilton', '44', '1985-01-07', 'https://via.placeholder.com/300x400?text=Lewis+Hamilton'),
('Charles Leclerc', '16', '1997-10-16', 'https://via.placeholder.com/300x400?text=Charles+Leclerc'),
('Lando Norris', '4', '1999-11-13', 'https://via.placeholder.com/300x400?text=Lando+Norris'),
('Fernando Alonso', '14', '1981-07-29', 'https://via.placeholder.com/300x400?text=Fernando+Alonso');

-- Insert sample circuits
INSERT INTO circuits (name, country, length, first_race_year, image_url) VALUES
('Silverstone Circuit', 'United Kingdom', 5.891, 1950, 'https://via.placeholder.com/800x400?text=Silverstone'),
('Monza Circuit', 'Italy', 5.793, 1950, 'https://via.placeholder.com/800x400?text=Monza'),
('Spa-Francorchamps', 'Belgium', 7.004, 1950, 'https://via.placeholder.com/800x400?text=Spa'),
('Monaco Circuit', 'Monaco', 3.337, 1950, 'https://via.placeholder.com/800x400?text=Monaco'),
('Suzuka Circuit', 'Japan', 5.807, 1987, 'https://via.placeholder.com/800x400?text=Suzuka');

-- Insert sample races for 2024
INSERT INTO races (name, season_id, circuit_id, date, round, status) 
SELECT 
  'British Grand Prix', 
  2024, 
  id, 
  '2024-07-07', 
  10, 
  'completed'
FROM circuits WHERE name = 'Silverstone Circuit';

INSERT INTO races (name, season_id, circuit_id, date, round, status) 
SELECT 
  'Italian Grand Prix', 
  2024, 
  id, 
  '2024-09-01', 
  15, 
  'completed'
FROM circuits WHERE name = 'Monza Circuit';

INSERT INTO races (name, season_id, circuit_id, date, round, status) 
SELECT 
  'Japanese Grand Prix', 
  2024, 
  id, 
  '2025-04-06', 
  5, 
  'upcoming'
FROM circuits WHERE name = 'Suzuka Circuit';

-- Note: To insert race results, driver/team season stats, you'll need the actual UUIDs
-- from the inserted records. Use the admin panel to add these after initial setup.

-- Example query to get IDs for manual insertion:
-- SELECT id, name FROM drivers;
-- SELECT id, name FROM teams;
-- SELECT id, name FROM races;
