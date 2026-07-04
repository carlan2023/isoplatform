Feature: Course enrollment and Mobile Money payment
  As a prospective ISO auditor
  I want to enroll in a course and pay by Mobile Money
  So that my seat is reserved and confirmed once payment succeeds

  Scenario: An individual sees the standard price and deposit
    When 1 participant prices a booking
    Then the full amount is "UGX 1,000,000"
    And the minimum deposit is "UGX 300,000"

  Scenario: Teams of three or more get the discounted rate
    When 3 participants price a booking
    Then the full amount is "UGX 2,100,000"
    And the minimum deposit is "UGX 630,000"

  Scenario: A deposit is an acceptable first payment
    Given a booking whose full amount is 1000000 and deposit is 300000
    Then paying 300000 is accepted
    And paying 600000 is accepted
    And paying 100000 is rejected
    And paying 1500000 is rejected

  Scenario: Seats are reserved up to capacity, then the course is full
    Given a course with 2 seats and 0 held
    Then a seat can be reserved as seat number 1
    And after 1 seat is held a seat can be reserved as seat number 2
    And after 2 seats are held no further seat can be reserved

  Scenario: A payment is only confirmed for the right amount
    Given a pending enrollment that owes 300000
    Then a collection of 300000 confirms the enrollment
    And a collection of 100000 does not confirm the enrollment
