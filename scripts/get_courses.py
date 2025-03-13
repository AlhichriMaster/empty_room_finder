from time import sleep
import pandas as pd
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import re

def select_semester(selected, driver):
    """Select the specified semester and proceed to search."""
    semesters = Select(driver.find_element(By.NAME, "term_code"))
    semesters.select_by_value(selected)

    button = driver.find_element(By.XPATH, "//input[@type='submit' and @value='Proceed to Search']")
    button.click()

    # Wait for page to load
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "subj_id"))
    )

def extract_class_schedule(driver):
    """
    Extract class schedule information including location and time for each class.
    
    Parameters:
    driver - Selenium WebDriver instance
    
    Returns:
    DataFrame with class information
    """
    # Wait for the table to be present
    try:
        wait = WebDriverWait(driver, 10)
        table = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "div[style*='overflow:auto'] > table")))
    except:
        # If no table found, return empty DataFrame
        print("No classes found for this program.")
        return pd.DataFrame()
    
    # Get all rows in the table
    rows = table.find_elements(By.TAG_NAME, "tr")
    
    classes = []
    current_class = None
    meeting_times = []
    section_info = ""
    
    for i, row in enumerate(rows):
        cells = row.find_elements(By.TAG_NAME, "td")
        
        # Skip empty rows or spacer rows
        if len(cells) <= 1 or (len(cells) > 1 and "&nbsp;" in cells[1].get_attribute('innerHTML')):
            # If we were building a class, finalize it before moving to next class
            if current_class and meeting_times:
                # Add each meeting time as a separate entry
                for meeting in meeting_times:
                    class_entry = current_class.copy()
                    class_entry.update(meeting)
                    class_entry['section_info'] = section_info
                    classes.append(class_entry)
                
                # Reset for next class
                meeting_times = []
                section_info = ""
                current_class = None
            continue
            
        # Main class row (with checkbox)
        if len(cells) > 2 and cells[0].find_elements(By.TAG_NAME, "input"):
            # If we were already building a class, finalize it before starting a new one
            if current_class and meeting_times:
                for meeting in meeting_times:
                    class_entry = current_class.copy()
                    class_entry.update(meeting)
                    class_entry['section_info'] = section_info
                    classes.append(class_entry)
            
            try:
                # Start a new class
                checkbox = cells[0].find_element(By.TAG_NAME, "input")
                current_crn = checkbox.get_attribute("value")
                
                # Extract course code from the link text to handle cases where the text might be different
                course_code_cell = cells[3]
                course_code_link = course_code_cell.find_element(By.TAG_NAME, "a")
                course_code = course_code_link.text
                
                # Extract course title from the link text
                title_cell = cells[5]
                title_link = title_cell.find_element(By.TAG_NAME, "a")
                title = title_link.text
                
                # Extract class information from the first row
                current_class = {
                    'crn': current_crn,
                    'status': cells[1].text,
                    'course_code': course_code,
                    'section': cells[4].text,
                    'title': title,
                    'credits': cells[6].text if len(cells) > 6 else "",
                    'type': cells[7].text if len(cells) > 7 else "",
                    'online': cells[8].text if len(cells) > 8 else "",
                    'hybrid': cells[9].text if len(cells) > 9 else "",
                    'instructor': cells[10].text if len(cells) > 10 else ""
                }
                meeting_times = []
                section_info = ""
            except Exception as e:
                print(f"Error processing main class row: {e}")
                current_class = None
            
        # Meeting date row
        elif len(cells) > 1 and "Meeting Date:" in cells[1].text:
            try:
                # Parse meeting information (date, days, time)
                meeting_text = cells[1].text
                date_match = re.search(r'Meeting Date:\s+(.*?)\s+to\s+(.*?)\s+Days:', meeting_text)
                days_match = re.search(r'Days:\s+(.*?)\s+Time:', meeting_text)
                time_match = re.search(r'Time:\s+(.*?)$', meeting_text)
                
                if date_match:
                    start_date = date_match.group(1)
                    end_date = date_match.group(2)
                    days = days_match.group(1) if days_match else ""
                    time_str = time_match.group(1) if time_match else ""
                    
                    # Parse time (if available)
                    start_time, end_time = "", ""
                    if time_str and " - " in time_str:
                        start_time, end_time = time_str.split(" - ")
                    
                    meeting_times.append({
                        'start_date': start_date,
                        'end_date': end_date,
                        'days': days,
                        'start_time': start_time,
                        'end_time': end_time
                    })
            except Exception as e:
                print(f"Error processing meeting date row: {e}")
                
        # Section information row
        elif len(cells) > 1 and "Section Information:" in cells[1].text:
            try:
                section_info = cells[1].text
                
                # Try to extract building and room information from section info
                location_match = re.search(r'(?:IN-PERSON|ONLINE|HYBRID).*?(?:in|at)?\s+([A-Za-z0-9\s]+)\s+(?:room|rm)?\s*([A-Za-z0-9\-]+)', section_info, re.IGNORECASE)
                if location_match and current_class:
                    current_class['building'] = location_match.group(1).strip()
                    current_class['room'] = location_match.group(2).strip()
            except Exception as e:
                print(f"Error processing section info row: {e}")
    
    # Make sure we add the last class
    if current_class and meeting_times:
        for meeting in meeting_times:
            class_entry = current_class.copy()
            class_entry.update(meeting)
            class_entry['section_info'] = section_info
            classes.append(class_entry)
    
    # Convert to DataFrame for easier manipulation
    df = pd.DataFrame(classes)
    
    if not df.empty:
        # Extract location information from section_info if not already parsed
        if 'building' not in df.columns:
            df['building'] = 'N/A'
            df['room'] = 'N/A'
            
            # Look for location patterns in section_info
            for i, row in df.iterrows():
                if 'section_info' in row:
                    section_info = row['section_info']
                    if 'IN-PERSON' in section_info:
                        df.at[i, 'building'] = 'See instructor' 
                        df.at[i, 'room'] = 'See instructor'
                    elif 'ONLINE' in section_info:
                        df.at[i, 'building'] = 'ONLINE'
                        df.at[i, 'room'] = 'ONLINE'
    
    return df

def get_all_programs(driver):
    """Get a list of all available program codes."""
    program_select = Select(driver.find_element(By.ID, 'subj_id'))
    program_options = program_select.options
    return [option.get_attribute('value') for option in program_options if option.get_attribute('value')]

def search_program(driver, program_code):
    """Select the specified program and search for classes."""
    # Wait for program select element to be present
    wait = WebDriverWait(driver, 10)
    program_list = wait.until(EC.presence_of_element_located((By.ID, 'subj_id')))
    
    # Select the program
    select = Select(program_list)
    select.deselect_all()
    select.select_by_value(program_code)
    
    # Click the search button
    button = driver.find_element(By.XPATH, "//input[@type='submit' and @value='Search']")
    button.click()
    
    # Wait for results to load
    sleep(3)  # Minimum wait to ensure page loads
    try:
        WebDriverWait(driver, 7).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div[style*='overflow:auto']"))
        )
    except:
        print(f"No results found for program {program_code} or timeout occurred.")

def main_function():
    """Main function to extract class schedules for all programs in a semester."""
    # Setup output directory
    output_dir = "class_schedules"
    os.makedirs(output_dir, exist_ok=True)
    
    # Initialize webdriver
    driver = webdriver.Chrome()
    
    try:
        # Navigate to the course selection page
        driver.get("https://central.carleton.ca/prod/bwysched.p_select_term?wsea_code=EXT")
        
        # Select the desired semester (Summer 2025 in this case)
        semester_code = "202520"
        select_semester(semester_code, driver)
        
        # Get all available programs
        programs = get_all_programs(driver)
        print(f"Found {len(programs)} programs to process")
        
        # DataFrame to store all results
        all_classes_df = pd.DataFrame()
        
        # Process each program
        for i, program in enumerate(programs):
            print(f"Processing program {i+1}/{len(programs)}: {program}")
            
            # Search for the program
            search_program(driver, program)
            
            # Extract class schedule
            program_df = extract_class_schedule(driver)
            
            # Add program code for reference
            if not program_df.empty:
                program_df['program_code'] = program
                
                # Append to the combined DataFrame
                all_classes_df = pd.concat([all_classes_df, program_df], ignore_index=True)
                
                # Save individual program data
                program_file = os.path.join(output_dir, f"{program}_{semester_code}.csv")
                program_df.to_csv(program_file, index=False)
                print(f"Saved {len(program_df)} classes for {program}")
            
            # Go back to the program selection page for the next iteration
            driver.back()
            sleep(2)  # Wait for page to load
        
        # Save the combined data
        if not all_classes_df.empty:
            combined_file = os.path.join(output_dir, f"all_classes_{semester_code}.csv")
            all_classes_df.to_csv(combined_file, index=False)
            print(f"Successfully saved all {len(all_classes_df)} classes to {combined_file}")
        else:
            print("No classes were found for any program.")
    
    except Exception as e:
        print(f"An error occurred: {e}")
    
    finally:
        # Close the browser
        driver.quit()

if __name__ == "__main__":
    main_function()