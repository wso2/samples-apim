"""
 Copyright (c) 2024, WSO2 LLC. (http://www.wso2.com). All Rights Reserved.

  This software is the property of WSO2 LLC. and its suppliers, if any.
  Dissemination of any information or reproduction of any material contained
  herein is strictly forbidden, unless permitted by WSO2 in accordance with
  the WSO2 Commercial License available at http://wso2.com/licenses.
  For specific language governing the permissions and limitations under
  this license, please see the license as well as any agreement you’ve
  entered into with WSO2 governing the purchase of this software and any
"""

import logging


class EndpointFilter(logging.Filter):
    """Filter class to exclude specific endpoints from log entries."""

    def __init__(self, excluded_endpoints: list[str]) -> None:
        """
        Initialize the EndpointFilter class.

        Args:
            excluded_endpoints: A list of endpoints to be excluded from log entries.
        """
        self.excluded_endpoints = excluded_endpoints

    def filter(self, record: logging.LogRecord) -> bool:
        """
        Filter out log entries for excluded endpoints.

        Args:
            record: The log record to be filtered.

        Returns:
            bool: True if the log entry should be included, False otherwise.
        """
        # return record.args and len(record.args) >= 3 and record.args[2] not in self.excluded_endpoints

        if not record.args or len(record.args) < 3:
            return True  # If there are no arguments or not enough arguments, include the log.

        url_path = record.args[2]

        # Check if the URL has query parameters
        has_query_params = '?' in url_path

        # Extract the base path before any query parameters
        base_path = url_path.split('?', 1)[0]

        # If the base path is in the excluded endpoints or the URL has query parameters, exclude it
        if base_path in self.excluded_endpoints or has_query_params:
            return False

        return True
