from loguru import logger
import sys
logger.remove()
logger.add(sys.stdout, level='INFO', format='<green>{time}</green> | <level>{level}</level> | {message}')
